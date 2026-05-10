package com.bjjdojo.app.data.repository

import com.bjjdojo.app.data.dao.CategoryDao
import com.bjjdojo.app.data.dao.TechniqueDao
import com.bjjdojo.app.data.entities.Category
import com.bjjdojo.app.data.entities.Technique
import com.bjjdojo.app.data.entities.TechniqueConnection
import kotlinx.coroutines.flow.Flow

class TechniqueRepository(
    private val techniqueDao: TechniqueDao,
    private val categoryDao: CategoryDao
) {
    val allTechniques: Flow<List<Technique>> = techniqueDao.getAllTechniques()
    val allCategories: Flow<List<Category>> = categoryDao.getAllCategories()

    fun getTechniquesByCategory(categoryId: Long) = techniqueDao.getTechniquesByCategory(categoryId)
    fun searchTechniques(query: String) = techniqueDao.searchTechniques(query)
    fun getConnectedFrom(id: Long) = techniqueDao.getConnectedFrom(id)
    fun getConnectedTo(id: Long) = techniqueDao.getConnectedTo(id)
    fun getConnectionsForTechnique(id: Long) = techniqueDao.getConnectionsForTechnique(id)

    suspend fun getTechniqueById(id: Long) = techniqueDao.getTechniqueById(id)
    suspend fun getCategoryById(id: Long) = categoryDao.getCategoryById(id)

    suspend fun insert(technique: Technique) = techniqueDao.insert(technique)
    suspend fun update(technique: Technique) = techniqueDao.update(technique)
    suspend fun delete(technique: Technique) = techniqueDao.delete(technique)

    suspend fun addConnection(connection: TechniqueConnection) =
        techniqueDao.insertConnections(listOf(connection))
}
