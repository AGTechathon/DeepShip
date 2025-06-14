package com.example.vocaleyesnew.facerecognition

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "faces")
data class FaceEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val personName: String,
    val faceEmbedding: String, // JSON string of face features/landmarks
    val imagePath: String? = null, // Optional path to stored face image
    val dateAdded: Long = System.currentTimeMillis(),
    val confidence: Float = 0.0f // Confidence score when this face was added
)
