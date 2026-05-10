package com.bjjdojo.app.data.entities

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index

@Entity(
    tableName = "technique_connections",
    primaryKeys = ["fromTechniqueId", "toTechniqueId"],
    foreignKeys = [
        ForeignKey(
            entity = Technique::class,
            parentColumns = ["id"],
            childColumns = ["fromTechniqueId"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = Technique::class,
            parentColumns = ["id"],
            childColumns = ["toTechniqueId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("fromTechniqueId"), Index("toTechniqueId")]
)
data class TechniqueConnection(
    val fromTechniqueId: Long,
    val toTechniqueId: Long,
    val connectionType: ConnectionType
)

enum class ConnectionType {
    FOLLOW_UP,   // natural next move
    COUNTER,     // used as a counter
    SETUP,       // sets this technique up
    TRANSITION   // positional transition
}
