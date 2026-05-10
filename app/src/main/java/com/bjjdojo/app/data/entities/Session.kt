package com.bjjdojo.app.data.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "sessions")
data class Session(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val date: Long,           // epoch millis
    val durationMinutes: Int,
    val sessionType: SessionType,
    val location: String,
    val partners: String,     // comma-separated names
    val notes: String,
    val energyLevel: Int,     // 1-5
    val tapsGiven: Int,
    val tapsReceived: Int
)

enum class SessionType { GI, NOGI, OPEN_MAT, COMPETITION, DRILLING }
