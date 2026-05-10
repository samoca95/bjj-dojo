package com.bjjdojo.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.ViewModelProvider
import com.bjjdojo.app.ui.navigation.AppNavigation
import com.bjjdojo.app.ui.theme.BJJDojoTheme
import com.bjjdojo.app.ui.viewmodels.SessionViewModel
import com.bjjdojo.app.ui.viewmodels.TechniqueViewModel

class MainActivity : ComponentActivity() {

    private val app by lazy { application as BJJDojoApp }

    private val sessionViewModel by lazy {
        ViewModelProvider(this, SessionViewModel.Factory(app.sessionRepository))[SessionViewModel::class.java]
    }

    private val techniqueViewModel by lazy {
        ViewModelProvider(this, TechniqueViewModel.Factory(app.techniqueRepository))[TechniqueViewModel::class.java]
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            BJJDojoTheme {
                AppNavigation(
                    sessionViewModel = sessionViewModel,
                    techniqueViewModel = techniqueViewModel
                )
            }
        }
    }
}
