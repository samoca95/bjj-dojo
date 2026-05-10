package com.bjjdojo.app.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.bjjdojo.app.data.entities.*
import com.bjjdojo.app.data.repository.TechniqueRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalCoroutinesApi::class)
class TechniqueViewModel(private val repo: TechniqueRepository) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _selectedCategoryId = MutableStateFlow<Long?>(null)
    val selectedCategoryId: StateFlow<Long?> = _selectedCategoryId.asStateFlow()

    val allCategories: StateFlow<List<Category>> = repo.allCategories
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val techniques: StateFlow<List<Technique>> = combine(
        _searchQuery,
        _selectedCategoryId
    ) { query, categoryId ->
        Pair(query, categoryId)
    }.flatMapLatest { (query, categoryId) ->
        when {
            query.isNotBlank() -> repo.searchTechniques(query)
            categoryId != null -> repo.getTechniquesByCategory(categoryId)
            else -> repo.allTechniques
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun setSearch(query: String) { _searchQuery.value = query }
    fun setCategory(id: Long?) { _selectedCategoryId.value = id; _searchQuery.value = "" }

    fun getConnectedFrom(id: Long) = repo.getConnectedFrom(id)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun getConnectedTo(id: Long) = repo.getConnectedTo(id)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun getConnectionsForTechnique(id: Long) = repo.getConnectionsForTechnique(id)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    suspend fun getTechniqueById(id: Long) = repo.getTechniqueById(id)
    suspend fun getCategoryById(id: Long) = repo.getCategoryById(id)

    fun insertTechnique(technique: Technique) = viewModelScope.launch { repo.insert(technique) }
    fun deleteTechnique(technique: Technique) = viewModelScope.launch { repo.delete(technique) }

    class Factory(private val repo: TechniqueRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>) = TechniqueViewModel(repo) as T
    }
}
