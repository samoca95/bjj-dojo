package com.bjjdojo.app.data.dao

import androidx.room.*
import com.bjjdojo.app.data.entities.Session
import com.bjjdojo.app.data.entities.SessionTechnique
import com.bjjdojo.app.data.entities.Technique
import kotlinx.coroutines.flow.Flow

@Dao
interface SessionDao {

    @Query("SELECT * FROM sessions ORDER BY date DESC")
    fun getAllSessions(): Flow<List<Session>>

    @Query("SELECT * FROM sessions WHERE id = :id")
    suspend fun getSessionById(id: Long): Session?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(session: Session): Long

    @Update
    suspend fun update(session: Session)

    @Delete
    suspend fun delete(session: Session)

    @Query("SELECT COUNT(*) FROM sessions")
    fun getSessionCount(): Flow<Int>

    @Query("SELECT SUM(durationMinutes) FROM sessions")
    fun getTotalMinutes(): Flow<Int?>

    @Query("SELECT SUM(tapsGiven) FROM sessions")
    fun getTotalTapsGiven(): Flow<Int?>

    @Query("SELECT SUM(tapsReceived) FROM sessions")
    fun getTotalTapsReceived(): Flow<Int?>

    // Session techniques (many-to-many)
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSessionTechnique(st: SessionTechnique)

    @Delete
    suspend fun deleteSessionTechnique(st: SessionTechnique)

    @Query("DELETE FROM session_techniques WHERE sessionId = :sessionId")
    suspend fun clearSessionTechniques(sessionId: Long)

    @Query("""
        SELECT t.* FROM techniques t
        INNER JOIN session_techniques st ON t.id = st.techniqueId
        WHERE st.sessionId = :sessionId
        ORDER BY t.name
    """)
    fun getTechniquesForSession(sessionId: Long): Flow<List<Technique>>

    @Query("""
        SELECT * FROM session_techniques WHERE sessionId = :sessionId
    """)
    suspend fun getSessionTechniques(sessionId: Long): List<SessionTechnique>

    @Query("""
        SELECT COUNT(DISTINCT sessionId) FROM session_techniques WHERE techniqueId = :techniqueId
    """)
    fun getSessionCountForTechnique(techniqueId: Long): Flow<Int>
}
