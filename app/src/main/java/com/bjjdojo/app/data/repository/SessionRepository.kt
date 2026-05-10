package com.bjjdojo.app.data.repository

import com.bjjdojo.app.data.dao.SessionDao
import com.bjjdojo.app.data.entities.Session
import com.bjjdojo.app.data.entities.SessionTechnique
import kotlinx.coroutines.flow.Flow

class SessionRepository(private val sessionDao: SessionDao) {

    val allSessions: Flow<List<Session>> = sessionDao.getAllSessions()
    val sessionCount: Flow<Int> = sessionDao.getSessionCount()
    val totalMinutes: Flow<Int?> = sessionDao.getTotalMinutes()
    val totalTapsGiven: Flow<Int?> = sessionDao.getTotalTapsGiven()
    val totalTapsReceived: Flow<Int?> = sessionDao.getTotalTapsReceived()

    fun getTechniquesForSession(sessionId: Long) = sessionDao.getTechniquesForSession(sessionId)
    fun getSessionCountForTechnique(techniqueId: Long) = sessionDao.getSessionCountForTechnique(techniqueId)

    suspend fun getSessionById(id: Long) = sessionDao.getSessionById(id)

    suspend fun insert(session: Session): Long = sessionDao.insert(session)
    suspend fun update(session: Session) = sessionDao.update(session)
    suspend fun delete(session: Session) = sessionDao.delete(session)

    suspend fun setSessionTechniques(sessionId: Long, techniqueIds: List<Long>) {
        sessionDao.clearSessionTechniques(sessionId)
        techniqueIds.forEach { id ->
            sessionDao.insertSessionTechnique(SessionTechnique(sessionId, id))
        }
    }

    suspend fun getSessionTechniques(sessionId: Long) = sessionDao.getSessionTechniques(sessionId)
}
