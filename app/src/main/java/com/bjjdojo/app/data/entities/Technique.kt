package com.bjjdojo.app.data.entities

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "techniques",
    foreignKeys = [
        ForeignKey(
            entity = Category::class,
            parentColumns = ["id"],
            childColumns = ["categoryId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("categoryId")]
)
data class Technique(
    @PrimaryKey(autoGenerate = false)
    val id: Long = 0,
    val name: String,
    val description: String,
    val categoryId: Long,
    val youtubeUrl: String,
    val difficulty: Difficulty = Difficulty.BEGINNER,
    val isCustom: Boolean = false
)

enum class Difficulty { BEGINNER, INTERMEDIATE, ADVANCED, ELITE }
