package com.bjjdojo.app.data.entities

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index

@Entity(
    tableName = "session_techniques",
    primaryKeys = ["sessionId", "techniqueId"],
    foreignKeys = [
        ForeignKey(
            entity = Session::class,
            parentColumns = ["id"],
            childColumns = ["sessionId"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = Technique::class,
            parentColumns = ["id"],
            childColumns = ["techniqueId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("sessionId"), Index("techniqueId")]
)
data class SessionTechnique(
    val sessionId: Long,
    val techniqueId: Long,
    val notes: String = ""
)
