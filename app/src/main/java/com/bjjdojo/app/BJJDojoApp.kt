package com.bjjdojo.app

import android.app.Application
import com.bjjdojo.app.data.database.AppDatabase
import com.bjjdojo.app.data.repository.SessionRepository
import com.bjjdojo.app.data.repository.TechniqueRepository

class BJJDojoApp : Application() {

    val database by lazy { AppDatabase.getInstance(this) }

    val techniqueRepository by lazy {
        TechniqueRepository(database.techniqueDao(), database.categoryDao())
    }

    val sessionRepository by lazy {
        SessionRepository(database.sessionDao())
    }
}
