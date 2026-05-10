package com.bjjdojo.app.data.dao

import androidx.room.*
import com.bjjdojo.app.data.entities.Technique
import com.bjjdojo.app.data.entities.TechniqueConnection
import kotlinx.coroutines.flow.Flow

@Dao
interface TechniqueDao {

    @Query("SELECT * FROM techniques ORDER BY name")
    fun getAllTechniques(): Flow<List<Technique>>

    @Query("SELECT * FROM techniques WHERE categoryId = :categoryId ORDER BY name")
    fun getTechniquesByCategory(categoryId: Long): Flow<List<Technique>>

    @Query("SELECT * FROM techniques WHERE id = :id")
    suspend fun getTechniqueById(id: Long): Technique?

    @Query("SELECT * FROM techniques WHERE name LIKE '%' || :query || '%'")
    fun searchTechniques(query: String): Flow<List<Technique>>

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAll(techniques: List<Technique>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(technique: Technique)

    @Update
    suspend fun update(technique: Technique)

    @Delete
    suspend fun delete(technique: Technique)

    // Connections
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertConnections(connections: List<TechniqueConnection>)

    @Query("""
        SELECT t.* FROM techniques t
        INNER JOIN technique_connections tc ON t.id = tc.toTechniqueId
        WHERE tc.fromTechniqueId = :techniqueId
    """)
    fun getConnectedFrom(techniqueId: Long): Flow<List<Technique>>

    @Query("""
        SELECT t.* FROM techniques t
        INNER JOIN technique_connections tc ON t.id = tc.fromTechniqueId
        WHERE tc.toTechniqueId = :techniqueId
    """)
    fun getConnectedTo(techniqueId: Long): Flow<List<Technique>>

    @Query("""
        SELECT * FROM technique_connections
        WHERE fromTechniqueId = :techniqueId OR toTechniqueId = :techniqueId
    """)
    fun getConnectionsForTechnique(techniqueId: Long): Flow<List<TechniqueConnection>>

    @Query("SELECT COUNT(*) FROM techniques")
    suspend fun count(): Int
}
