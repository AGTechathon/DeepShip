package com.example.vocaleyesnew.facerecognition

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface FaceDao {
    @Query("SELECT * FROM faces ORDER BY dateAdded DESC")
    fun getAllFaces(): Flow<List<FaceEntity>>
    
    @Query("SELECT * FROM faces WHERE personName = :name")
    suspend fun getFacesByName(name: String): List<FaceEntity>
    
    @Query("SELECT * FROM faces WHERE id = :id")
    suspend fun getFaceById(id: Long): FaceEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFace(face: FaceEntity): Long
    
    @Update
    suspend fun updateFace(face: FaceEntity)
    
    @Delete
    suspend fun deleteFace(face: FaceEntity)
    
    @Query("DELETE FROM faces WHERE personName = :name")
    suspend fun deleteFacesByName(name: String)
    
    @Query("SELECT COUNT(*) FROM faces")
    suspend fun getFaceCount(): Int
    
    @Query("SELECT DISTINCT personName FROM faces ORDER BY personName ASC")
    suspend fun getAllPersonNames(): List<String>
}
