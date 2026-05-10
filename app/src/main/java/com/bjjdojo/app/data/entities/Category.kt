package com.bjjdojo.app.data.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "categories")
data class Category(
    @PrimaryKey(autoGenerate = false)
    val id: Long = 0,
    val name: String,
    val description: String,
    val iconName: String
)
