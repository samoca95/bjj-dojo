package com.bjjdojo.app.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.bjjdojo.app.data.dao.CategoryDao
import com.bjjdojo.app.data.dao.SessionDao
import com.bjjdojo.app.data.dao.TechniqueDao
import com.bjjdojo.app.data.entities.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        Category::class,
        Technique::class,
        TechniqueConnection::class,
        Session::class,
        SessionTechnique::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun categoryDao(): CategoryDao
    abstract fun techniqueDao(): TechniqueDao
    abstract fun sessionDao(): SessionDao

    companion object {
        @Volatile private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase =
            INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "bjj_dojo.db"
                )
                    .addCallback(PrepopulateCallback())
                    .build()
                    .also { INSTANCE = it }
            }
    }

    private class PrepopulateCallback : Callback() {
        override fun onCreate(db: SupportSQLiteDatabase) {
            super.onCreate(db)
            INSTANCE?.let { database ->
                CoroutineScope(Dispatchers.IO).launch {
                    database.categoryDao().insertAll(PrefilledData.categories)
                    database.techniqueDao().insertAll(PrefilledData.techniques)
                    database.techniqueDao().insertConnections(PrefilledData.connections)
                }
            }
        }
    }
}
