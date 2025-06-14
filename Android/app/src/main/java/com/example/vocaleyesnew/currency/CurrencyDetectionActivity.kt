package com.example.vocaleyesnew.currency

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.example.vocaleyesnew.BaseVoiceActivity
import com.example.vocaleyesnew.ui.theme.VocalEyesNewTheme
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.util.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class CurrencyDetectionActivity : BaseVoiceActivity(), TextToSpeech.OnInitListener {
    private lateinit var cameraExecutor: ExecutorService
    private lateinit var textToSpeech: TextToSpeech
    var lastDetectionTime = 0L
    val detectionInterval = 3000L // 3 seconds between detections
    
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            // Permission granted, camera will start automatically
        } else {
            voiceRecognitionManager.speak("Camera permission is required for currency detection. Please grant permission in settings.")
            finish()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        cameraExecutor = Executors.newSingleThreadExecutor()
        textToSpeech = TextToSpeech(this, this)
        
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) 
            != PackageManager.PERMISSION_GRANTED) {
            requestPermissionLauncher.launch(Manifest.permission.CAMERA)
        }

        setContent {
            VocalEyesNewTheme {
                CurrencyDetectionScreen(
                    onBackPressed = { finish() }
                )
            }
        }
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            textToSpeech.language = Locale.getDefault()
            voiceRecognitionManager.speak("Indian currency detection ready. Point your camera at rupee notes or coins. I will tell you the exact value. Say go back to return.")
        }
    }

    override fun setupActivityVoiceCommands() {
        voiceRecognitionManager.setActivitySpecificListener { command ->
            when {
                command.contains("scan") || command.contains("detect") -> {
                    voiceRecognitionManager.speak("Scanning for Indian rupee notes...")
                    true
                }
                command.contains("what currency") || command.contains("what money") || command.contains("what rupee") -> {
                    voiceRecognitionManager.speak("Point your camera at the rupee note and I'll tell you the exact value - ten, twenty, fifty, hundred, two hundred, five hundred, or two thousand rupees")
                    true
                }
                command.contains("help") -> {
                    voiceRecognitionManager.speak("I can detect Indian rupee notes. Point your camera at any rupee note and I'll tell you if it's ten, twenty, fifty, hundred, two hundred, five hundred, or two thousand rupees.")
                    true
                }
                else -> false
            }
        }
    }

    fun speakCurrency(text: String) {
        voiceRecognitionManager.speak(text)
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
        textToSpeech.stop()
        textToSpeech.shutdown()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CurrencyDetectionScreen(
    onBackPressed: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    var detectedCurrency by remember { mutableStateOf("Point camera at Indian rupee notes") }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Indian Currency Detection") },
                navigationIcon = {
                    IconButton(onClick = onBackPressed) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Camera Preview
            AndroidView(
                factory = { ctx ->
                    PreviewView(ctx).apply {
                        implementationMode = PreviewView.ImplementationMode.COMPATIBLE
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                update = { previewView ->
                    startCamera(context, lifecycleOwner, previewView) { currency ->
                        detectedCurrency = currency
                    }
                }
            )
            
            // Detection Result
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
            ) {
                Text(
                    text = detectedCurrency,
                    style = MaterialTheme.typography.headlineSmall,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp)
                )
            }
            
            Text(
                text = "Voice Commands: 'scan', 'what currency', 'go back'\nI will announce the exact rupee value (₹10, ₹20, ₹50, ₹100, ₹200, ₹500, ₹2000)",
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(16.dp)
            )
        }
    }
}

private fun startCamera(
    context: android.content.Context,
    lifecycleOwner: LifecycleOwner,
    previewView: PreviewView,
    onCurrencyDetected: (String) -> Unit
) {
    val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
    
    cameraProviderFuture.addListener({
        val cameraProvider = cameraProviderFuture.get()
        
        val preview = Preview.Builder().build().also {
            it.setSurfaceProvider(previewView.surfaceProvider)
        }
        
        val imageAnalyzer = ImageAnalysis.Builder()
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build()
            .also {
                it.setAnalyzer(ContextCompat.getMainExecutor(context)) { imageProxy ->
                    processImage(imageProxy, onCurrencyDetected, context)
                }
            }
        
        val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
        
        try {
            cameraProvider.unbindAll()
            cameraProvider.bindToLifecycle(
                lifecycleOwner,
                cameraSelector,
                preview,
                imageAnalyzer
            )
        } catch (exc: Exception) {
            Log.e("CurrencyDetection", "Camera binding failed", exc)
        }
    }, ContextCompat.getMainExecutor(context))
}

@androidx.camera.core.ExperimentalGetImage
private fun processImage(
    imageProxy: ImageProxy,
    onCurrencyDetected: (String) -> Unit,
    context: android.content.Context
) {
    val mediaImage = imageProxy.image
    if (mediaImage != null) {
        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
        
        val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
        
        recognizer.process(image)
            .addOnSuccessListener { visionText ->
                val detectedText = visionText.text.lowercase()
                val currency = analyzeCurrencyText(detectedText)
                
                if (currency.isNotEmpty()) {
                    onCurrencyDetected(currency)
                    
                    // Speak the detected currency using TTS
                    if (context is CurrencyDetectionActivity) {
                        val currentTime = System.currentTimeMillis()
                        if (currentTime - context.lastDetectionTime >= context.detectionInterval) {
                            context.speakCurrency("Detected: $currency")
                            context.lastDetectionTime = currentTime
                        }
                    }
                }
            }
            .addOnFailureListener { e ->
                Log.e("CurrencyDetection", "Text recognition failed", e)
            }
            .addOnCompleteListener {
                imageProxy.close()
            }
    } else {
        imageProxy.close()
    }
}

private fun analyzeCurrencyText(text: String): String {
    // First, prioritize Indian currency detection
    val indianCurrency = detectIndianCurrency(text)
    if (indianCurrency.isNotEmpty()) {
        return indianCurrency
    }

    // Then try other specific denominations
    val specificDenominations = detectSpecificDenomination(text)
    if (specificDenominations.isNotEmpty()) {
        return specificDenominations
    }

    // Currency detection patterns (fallback)
    val currencyPatterns = mapOf(
        // US Dollar
        "united states" to "US Dollar",
        "federal reserve" to "US Dollar",
        "washington" to "US Dollar",
        "lincoln" to "US Dollar",
        "hamilton" to "US Dollar",
        "jackson" to "US Dollar",
        "grant" to "US Dollar",
        "franklin" to "US Dollar",
        "in god we trust" to "US Dollar",
        "dollar" to "US Dollar",
        "america" to "US Dollar",

        // Euro
        "euro" to "Euro",
        "european central bank" to "Euro",
        "€" to "Euro",
        "eur" to "Euro",

        // British Pound
        "bank of england" to "British Pound",
        "pound sterling" to "British Pound",
        "elizabeth" to "British Pound",
        "£" to "British Pound",
        "gbp" to "British Pound",
        "england" to "British Pound",

        // Canadian Dollar
        "bank of canada" to "Canadian Dollar",
        "canada" to "Canadian Dollar",
        "cad" to "Canadian Dollar",

        // Australian Dollar
        "reserve bank of australia" to "Australian Dollar",
        "australia" to "Australian Dollar",
        "aud" to "Australian Dollar",

        // Japanese Yen
        "bank of japan" to "Japanese Yen",
        "nippon ginko" to "Japanese Yen",
        "¥" to "Japanese Yen",
        "yen" to "Japanese Yen",
        "jpy" to "Japanese Yen",
        "japan" to "Japanese Yen",

        // Indian Rupee
        "reserve bank of india" to "Indian Rupee",
        "bharat" to "Indian Rupee",
        "india" to "Indian Rupee",
        "₹" to "Indian Rupee",
        "rupee" to "Indian Rupee",
        "inr" to "Indian Rupee",

        // Chinese Yuan
        "people's bank of china" to "Chinese Yuan",
        "china" to "Chinese Yuan",
        "yuan" to "Chinese Yuan",
        "renminbi" to "Chinese Yuan",
        "cny" to "Chinese Yuan",

        // Swiss Franc
        "switzerland" to "Swiss Franc",
        "swiss" to "Swiss Franc",
        "franc" to "Swiss Franc",
        "chf" to "Swiss Franc"
    )
    
    // Check for currency patterns
    for ((pattern, currency) in currencyPatterns) {
        if (text.contains(pattern)) {
            return currency
        }
    }
    


    // Check for general currency indicators as fallback
    val denominations = listOf("1", "5", "10", "20", "50", "100", "500", "1000")
    val hasNumber = denominations.any { text.contains(it) }

    if (hasNumber && (text.contains("dollar") || text.contains("note") || text.contains("bill") ||
                     text.contains("euro") || text.contains("pound") || text.contains("rupee"))) {
        return "Currency Note Detected"
    }

    return ""
}

private fun detectIndianCurrency(text: String): String {
    // Enhanced Indian Rupee detection patterns
    val indianRupeePatterns = mapOf(
        // Specific denominations with multiple patterns
        "10" to "Ten Rupees",
        "ten" to "Ten Rupees",
        "दस" to "Ten Rupees",

        "20" to "Twenty Rupees",
        "twenty" to "Twenty Rupees",
        "बीस" to "Twenty Rupees",

        "50" to "Fifty Rupees",
        "fifty" to "Fifty Rupees",
        "पचास" to "Fifty Rupees",

        "100" to "One Hundred Rupees",
        "hundred" to "One Hundred Rupees",
        "सौ" to "One Hundred Rupees",

        "200" to "Two Hundred Rupees",
        "two hundred" to "Two Hundred Rupees",
        "दो सौ" to "Two Hundred Rupees",

        "500" to "Five Hundred Rupees",
        "five hundred" to "Five Hundred Rupees",
        "पांच सौ" to "Five Hundred Rupees",

        "2000" to "Two Thousand Rupees",
        "two thousand" to "Two Thousand Rupees",
        "दो हजार" to "Two Thousand Rupees"
    )

    // Indian currency identifiers
    val indianIdentifiers = listOf(
        "reserve bank of india",
        "भारतीय रिज़र्व बैंक",
        "रिज़र्व बैंक",
        "भारत सरकार",
        "government of india",
        "rupee", "rupees",
        "₹",
        "भारत",
        "india",
        "mahatma gandhi",
        "गांधी",
        "satyameva jayate",
        "सत्यमेव जयते"
    )

    // Check if text contains Indian currency identifiers
    val hasIndianIdentifier = indianIdentifiers.any { identifier ->
        text.contains(identifier, ignoreCase = true)
    }

    if (hasIndianIdentifier) {
        // Look for specific denominations
        for ((pattern, value) in indianRupeePatterns) {
            if (text.contains(pattern, ignoreCase = true)) {
                return value
            }
        }

        // Try to extract numeric values for Indian currency
        val numericValue = extractIndianNumericValue(text)
        if (numericValue.isNotEmpty()) {
            return numericValue
        }

        // Default to generic Indian currency if identifiers found but no specific value
        return "Indian Rupee Note"
    }

    return ""
}

private fun extractIndianNumericValue(text: String): String {
    // Patterns specifically for Indian currency
    val patterns = listOf(
        Regex("""(\d+)\s*rupee""", RegexOption.IGNORE_CASE),
        Regex("""(\d+)\s*रुपए"""),
        Regex("""₹\s*(\d+)"""),
        Regex("""(\d+)\s*₹"""),
        Regex("""\b(\d+)\b""") // Any standalone number when Indian identifiers are present
    )

    for (pattern in patterns) {
        val match = pattern.find(text)
        if (match != null) {
            val value = match.groupValues[1].toIntOrNull()
            if (value != null) {
                return when (value) {
                    1 -> "One Rupee"
                    2 -> "Two Rupees"
                    5 -> "Five Rupees"
                    10 -> "Ten Rupees"
                    20 -> "Twenty Rupees"
                    50 -> "Fifty Rupees"
                    100 -> "One Hundred Rupees"
                    200 -> "Two Hundred Rupees"
                    500 -> "Five Hundred Rupees"
                    2000 -> "Two Thousand Rupees"
                    else -> "$value Rupees"
                }
            }
        }
    }

    return ""
}

private fun detectSpecificDenomination(text: String): String {
    // US Dollar specific denominations with presidents and features
    val usDollarDenominations = mapOf(
        // $1 Bill
        "washington" to "One Dollar Bill",
        "george washington" to "One Dollar Bill",
        "1 dollar" to "One Dollar Bill",
        "one dollar" to "One Dollar Bill",

        // $2 Bill (rare)
        "jefferson" to "Two Dollar Bill",
        "thomas jefferson" to "Two Dollar Bill",
        "2 dollar" to "Two Dollar Bill",
        "two dollar" to "Two Dollar Bill",

        // $5 Bill
        "lincoln" to "Five Dollar Bill",
        "abraham lincoln" to "Five Dollar Bill",
        "5 dollar" to "Five Dollar Bill",
        "five dollar" to "Five Dollar Bill",

        // $10 Bill
        "hamilton" to "Ten Dollar Bill",
        "alexander hamilton" to "Ten Dollar Bill",
        "10 dollar" to "Ten Dollar Bill",
        "ten dollar" to "Ten Dollar Bill",

        // $20 Bill
        "jackson" to "Twenty Dollar Bill",
        "andrew jackson" to "Twenty Dollar Bill",
        "20 dollar" to "Twenty Dollar Bill",
        "twenty dollar" to "Twenty Dollar Bill",

        // $50 Bill
        "grant" to "Fifty Dollar Bill",
        "ulysses grant" to "Fifty Dollar Bill",
        "50 dollar" to "Fifty Dollar Bill",
        "fifty dollar" to "Fifty Dollar Bill",

        // $100 Bill
        "franklin" to "One Hundred Dollar Bill",
        "benjamin franklin" to "One Hundred Dollar Bill",
        "100 dollar" to "One Hundred Dollar Bill",
        "one hundred dollar" to "One Hundred Dollar Bill"
    )

    // Euro denominations
    val euroDenominations = mapOf(
        "5 euro" to "Five Euro Note",
        "five euro" to "Five Euro Note",
        "10 euro" to "Ten Euro Note",
        "ten euro" to "Ten Euro Note",
        "20 euro" to "Twenty Euro Note",
        "twenty euro" to "Twenty Euro Note",
        "50 euro" to "Fifty Euro Note",
        "fifty euro" to "Fifty Euro Note",
        "100 euro" to "One Hundred Euro Note",
        "one hundred euro" to "One Hundred Euro Note",
        "200 euro" to "Two Hundred Euro Note",
        "two hundred euro" to "Two Hundred Euro Note",
        "500 euro" to "Five Hundred Euro Note",
        "five hundred euro" to "Five Hundred Euro Note"
    )

    // British Pound denominations
    val poundDenominations = mapOf(
        "5 pound" to "Five Pound Note",
        "five pound" to "Five Pound Note",
        "10 pound" to "Ten Pound Note",
        "ten pound" to "Ten Pound Note",
        "20 pound" to "Twenty Pound Note",
        "twenty pound" to "Twenty Pound Note",
        "50 pound" to "Fifty Pound Note",
        "fifty pound" to "Fifty Pound Note"
    )

    // Indian Rupee denominations
    val rupeeDenominations = mapOf(
        "10 rupee" to "Ten Rupee Note",
        "ten rupee" to "Ten Rupee Note",
        "20 rupee" to "Twenty Rupee Note",
        "twenty rupee" to "Twenty Rupee Note",
        "50 rupee" to "Fifty Rupee Note",
        "fifty rupee" to "Fifty Rupee Note",
        "100 rupee" to "One Hundred Rupee Note",
        "one hundred rupee" to "One Hundred Rupee Note",
        "200 rupee" to "Two Hundred Rupee Note",
        "two hundred rupee" to "Two Hundred Rupee Note",
        "500 rupee" to "Five Hundred Rupee Note",
        "five hundred rupee" to "Five Hundred Rupee Note",
        "2000 rupee" to "Two Thousand Rupee Note",
        "two thousand rupee" to "Two Thousand Rupee Note"
    )

    // Check US Dollar denominations first
    for ((pattern, denomination) in usDollarDenominations) {
        if (text.contains(pattern)) {
            return denomination
        }
    }

    // Check Euro denominations
    for ((pattern, denomination) in euroDenominations) {
        if (text.contains(pattern)) {
            return denomination
        }
    }

    // Check Pound denominations
    for ((pattern, denomination) in poundDenominations) {
        if (text.contains(pattern)) {
            return denomination
        }
    }

    // Check Rupee denominations
    for ((pattern, denomination) in rupeeDenominations) {
        if (text.contains(pattern)) {
            return denomination
        }
    }

    // Check for Indian coin denominations first
    val indianCoinResult = detectIndianCoins(text)
    if (indianCoinResult.isNotEmpty()) {
        return indianCoinResult
    }

    // Check for other coin denominations
    val coinResult = detectCoins(text)
    if (coinResult.isNotEmpty()) {
        return coinResult
    }

    // Try to extract numeric values with currency indicators
    return extractNumericValue(text)
}

private fun detectIndianCoins(text: String): String {
    // Indian coin denominations
    val indianCoinPatterns = mapOf(
        "1 rupee" to "One Rupee Coin",
        "one rupee" to "One Rupee Coin",
        "एक रुपया" to "One Rupee Coin",

        "2 rupee" to "Two Rupee Coin",
        "two rupee" to "Two Rupee Coin",
        "दो रुपए" to "Two Rupee Coin",

        "5 rupee" to "Five Rupee Coin",
        "five rupee" to "Five Rupee Coin",
        "पांच रुपए" to "Five Rupee Coin",

        "10 rupee" to "Ten Rupee Coin",
        "ten rupee" to "Ten Rupee Coin",
        "दस रुपए" to "Ten Rupee Coin",

        // Paisa (though not commonly used now)
        "50 paisa" to "Fifty Paisa Coin",
        "fifty paisa" to "Fifty Paisa Coin",
        "पचास पैसे" to "Fifty Paisa Coin"
    )

    // Indian coin identifiers
    val indianCoinIdentifiers = listOf(
        "भारत", "india", "rupee", "रुपए", "रुपया", "paisa", "पैसे"
    )

    // Check if text contains Indian coin identifiers
    val hasIndianCoinIdentifier = indianCoinIdentifiers.any { identifier ->
        text.contains(identifier, ignoreCase = true)
    }

    if (hasIndianCoinIdentifier) {
        // Look for specific coin denominations
        for ((pattern, coin) in indianCoinPatterns) {
            if (text.contains(pattern, ignoreCase = true)) {
                return coin
            }
        }

        // Try to extract numeric values for Indian coins
        val patterns = listOf(
            Regex("""(\d+)\s*rupee""", RegexOption.IGNORE_CASE),
            Regex("""(\d+)\s*paisa""", RegexOption.IGNORE_CASE),
            Regex("""₹\s*(\d+)""")
        )

        for (pattern in patterns) {
            val match = pattern.find(text)
            if (match != null) {
                val value = match.groupValues[1].toIntOrNull()
                if (value != null && value <= 10) { // Coins are typically small denominations
                    return when (value) {
                        1 -> "One Rupee Coin"
                        2 -> "Two Rupee Coin"
                        5 -> "Five Rupee Coin"
                        10 -> "Ten Rupee Coin"
                        else -> "$value Rupee Coin"
                    }
                }
            }
        }
    }

    return ""
}

private fun detectCoins(text: String): String {
    // US Coin denominations
    val usCoinPatterns = mapOf(
        "penny" to "One Cent Coin",
        "cent" to "One Cent Coin",
        "nickel" to "Five Cent Coin",
        "dime" to "Ten Cent Coin",
        "quarter" to "Twenty Five Cent Coin",
        "half dollar" to "Fifty Cent Coin",
        "dollar coin" to "One Dollar Coin",
        "1 cent" to "One Cent Coin",
        "5 cent" to "Five Cent Coin",
        "10 cent" to "Ten Cent Coin",
        "25 cent" to "Twenty Five Cent Coin",
        "50 cent" to "Fifty Cent Coin"
    )

    // Euro coin denominations
    val euroCoinPatterns = mapOf(
        "1 euro cent" to "One Euro Cent",
        "2 euro cent" to "Two Euro Cent",
        "5 euro cent" to "Five Euro Cent",
        "10 euro cent" to "Ten Euro Cent",
        "20 euro cent" to "Twenty Euro Cent",
        "50 euro cent" to "Fifty Euro Cent",
        "1 euro coin" to "One Euro Coin",
        "2 euro coin" to "Two Euro Coin"
    )

    // British coin denominations
    val ukCoinPatterns = mapOf(
        "1 penny" to "One Penny Coin",
        "2 pence" to "Two Pence Coin",
        "5 pence" to "Five Pence Coin",
        "10 pence" to "Ten Pence Coin",
        "20 pence" to "Twenty Pence Coin",
        "50 pence" to "Fifty Pence Coin",
        "1 pound coin" to "One Pound Coin",
        "2 pound coin" to "Two Pound Coin"
    )

    // Check US coins
    for ((pattern, coin) in usCoinPatterns) {
        if (text.contains(pattern)) {
            return coin
        }
    }

    // Check Euro coins
    for ((pattern, coin) in euroCoinPatterns) {
        if (text.contains(pattern)) {
            return coin
        }
    }

    // Check UK coins
    for ((pattern, coin) in ukCoinPatterns) {
        if (text.contains(pattern)) {
            return coin
        }
    }

    return ""
}

private fun extractNumericValue(text: String): String {
    // Regular expressions to find numbers followed by currency indicators
    val patterns = listOf(
        Regex("""(\d+)\s*dollar"""),
        Regex("""(\d+)\s*euro"""),
        Regex("""(\d+)\s*pound"""),
        Regex("""(\d+)\s*rupee"""),
        Regex("""(\d+)\s*yen"""),
        Regex("""(\d+)\s*yuan"""),
        Regex("""(\d+)\s*franc"""),
        Regex("""\$(\d+)"""),
        Regex("""€(\d+)"""),
        Regex("""£(\d+)"""),
        Regex("""₹(\d+)"""),
        Regex("""¥(\d+)""")
    )

    for (pattern in patterns) {
        val match = pattern.find(text)
        if (match != null) {
            val value = match.groupValues[1]
            return when {
                text.contains("dollar") || text.contains("$") -> "$value Dollar"
                text.contains("euro") || text.contains("€") -> "$value Euro"
                text.contains("pound") || text.contains("£") -> "$value Pound"
                text.contains("rupee") || text.contains("₹") -> "$value Rupee"
                text.contains("yen") || text.contains("¥") -> "$value Yen"
                text.contains("yuan") -> "$value Yuan"
                text.contains("franc") -> "$value Franc"
                else -> "$value Currency Unit"
            }
        }
    }

    return ""
}
