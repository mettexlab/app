package org.koin.compose

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import com.coolappstore.everdialer.by.svhp.controller.util.PreferenceManager

@Composable
inline fun <reified T> koinInject(): T {
    val context = LocalContext.current.applicationContext
    if (T::class == PreferenceManager::class) {
        return PreferenceManager.getInstance(context) as T
    }
    throw IllegalArgumentException("Unsupported injectable type: ${T::class}")
}
