package com.bjjdojo.app.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.bjjdojo.app.data.entities.Session
import com.bjjdojo.app.data.repository.SessionRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class SessionViewModel(private val repo: SessionRepository) : ViewModel() {

    val sessions: StateFlow<List<Session>> = repo.allSessions
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val sessionCount: StateFlow<Int> = repo.sessionCount
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val totalMinutes: StateFlow<Int> = repo.totalMinutes
        .map { it ?: 0 }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val totalTapsGiven: StateFlow<Int> = repo.totalTapsGiven
        .map { it ?: 0 }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val totalTapsReceived: StateFlow<Int> = repo.totalTapsReceived
        .map { it ?: 0 }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    fun getTechniquesForSession(sessionId: Long) =
        repo.getTechniquesForSession(sessionId)
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun getSessionCountForTechnique(techniqueId: Long) =
        repo.getSessionCountForTechnique(techniqueId)
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    suspend fun getSessionById(id: Long) = repo.getSessionById(id)

    fun saveSession(
        session: Session,
        techniqueIds: List<Long>,
        onSaved: (Long) -> Unit = {}
    ) = viewModelScope.launch {
        val id = repo.insert(session)
        repo.setSessionTechniques(id, techniqueIds)
        onSaved(id)
    }

    fun updateSession(session: Session, techniqueIds: List<Long>) = viewModelScope.launch {
        repo.update(session)
        repo.setSessionTechniques(session.id, techniqueIds)
    }

    fun deleteSession(session: Session) = viewModelScope.launch { repo.delete(session) }

    suspend fun getSessionTechniqueIds(sessionId: Long) =
        repo.getSessionTechniques(sessionId).map { it.techniqueId }

    class Factory(private val repo: SessionRepository) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>) = SessionViewModel(repo) as T
    }
}
