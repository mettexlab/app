package com.coolappstore.everdialer.by.svhp.view.theme

import androidx.compose.ui.Modifier

class SettingsTransitionStyle

fun Modifier.settingsMotionBlur(maxBlurDp: Float = 10f): Modifier = this

fun Modifier.wpTurnstileHeader(delayMs: Int? = null): Modifier = this

fun Modifier.wpTurnstileCard(delayMs: Int? = null): Modifier = this

fun isWindowsPhoneAnimation(): Boolean = false

object SettingsClickTracker {
    fun recordTap(x: Float, y: Float, w: Float, h: Float) {}
}
