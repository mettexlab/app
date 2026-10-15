package com.crm.reminder

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import com.coolappstore.everdialer.by.svhp.view.screen.settings.UpdatesScreen
import com.ramcosta.composedestinations.navigation.DestinationsNavigator

class UpdatesActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val dark = isSystemInDarkTheme()
            MaterialTheme(colorScheme = if (dark) darkColorScheme() else lightColorScheme()) {
                UpdatesScreen(
                    navigator = object : DestinationsNavigator {
                        override fun navigateUp(): Boolean {
                            finish()
                            return true
                        }
                    }
                )
            }
        }
    }
}
