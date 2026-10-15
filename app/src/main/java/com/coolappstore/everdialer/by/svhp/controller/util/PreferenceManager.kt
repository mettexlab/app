package com.coolappstore.everdialer.by.svhp.controller.util

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class PreferenceManager private constructor(context: Context) {
    private val appContext = context.applicationContext
    val context: Context get() = appContext
    private val prefs: SharedPreferences =
        context.getSharedPreferences("crm_prefs", Context.MODE_PRIVATE)

    private val _settingsChanged = MutableStateFlow(0)
    val settingsChanged: StateFlow<Int> = _settingsChanged.asStateFlow()

    private val listener = SharedPreferences.OnSharedPreferenceChangeListener { _, _ ->
        _settingsChanged.value += 1
    }

    init {
        prefs.registerOnSharedPreferenceChangeListener(listener)
    }

    fun getBoolean(key: String, defaultValue: Boolean) = prefs.getBoolean(key, defaultValue)
    fun setBoolean(key: String, value: Boolean) {
        prefs.edit().putBoolean(key, value).apply()
        _settingsChanged.value += 1
    }

    fun getString(key: String, defaultValue: String?) = prefs.getString(key, defaultValue)
    fun setString(key: String, value: String?) {
        prefs.edit().putString(key, value).apply()
        _settingsChanged.value += 1
    }

    fun getInt(key: String, defaultValue: Int) = prefs.getInt(key, defaultValue)
    fun setInt(key: String, value: Int) {
        prefs.edit().putInt(key, value).apply()
        _settingsChanged.value += 1
    }

    fun getFloat(key: String, defaultValue: Float) = prefs.getFloat(key, defaultValue)
    fun setFloat(key: String, value: Float) {
        prefs.edit().putFloat(key, value).apply()
        _settingsChanged.value += 1
    }

    fun getLong(key: String, defaultValue: Long) = prefs.getLong(key, defaultValue)
    fun setLong(key: String, value: Long) {
        prefs.edit().putLong(key, value).apply()
        _settingsChanged.value += 1
    }

    fun remove(key: String) {
        prefs.edit().remove(key).apply()
        _settingsChanged.value += 1
    }

    fun isSaturatedForTheme(isDark: Boolean): Boolean = false

    companion object {
        const val KEY_APP_HAPTICS = "app_haptics_enabled"
        const val KEY_APP_HAPTICS_STRENGTH = "app_haptics_strength"
        const val KEY_HAPTICS_CUSTOM_INTENSITY = "haptics_custom_intensity"
        const val KEY_HAPTIC_TOUCH_ONLY = "haptic_touch_only"
        const val KEY_AUTO_UPDATE_CHECK = "auto_update_check"
        const val KEY_DOWNLOADED_UPDATE_VERSION = "downloaded_update_version"
        const val KEY_LAST_APP_VERSION = "last_app_version"
        const val KEY_APP_OPEN_COUNT = "app_open_count"
        const val KEY_DYNAMIC_COLORS = "dynamic_colors"
        const val KEY_MOTION_BLUR_ANIMATION = "motion_blur_animation"
        const val KEY_SCROLL_HAPTICS = "scroll_haptics"
        const val KEY_SCROLL_CM_PER_HAPTIC = "scroll_cm_per_haptic"
        const val KEY_SCROLL_HAPTIC_STRENGTH = "scroll_haptic_strength"

        @Volatile
        private var INSTANCE: PreferenceManager? = null

        fun getInstance(context: Context): PreferenceManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: PreferenceManager(context.applicationContext).also { INSTANCE = it }
            }
        }
    }
}
