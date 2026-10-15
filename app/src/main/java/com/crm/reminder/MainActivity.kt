package com.crm.reminder

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null

    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            val uri = result.data?.data
            val uris = if (uri != null) arrayOf(uri) else null
            fileUploadCallback?.onReceiveValue(uris)
        } else {
            fileUploadCallback?.onReceiveValue(null)
        }
        fileUploadCallback = null
    }

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            Toast.makeText(this, "Expiry notifications enabled!", Toast.LENGTH_SHORT).show()
            triggerImmediateCheck()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        ReminderWorker.createNotificationChannel(this)
        scheduleDailyReminderWork()
        checkNotificationPermission()
        checkAutoUpdate()

        webView = WebView(this).apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                useWideViewPort = true
                loadWithOverviewMode = true
                cacheMode = WebSettings.LOAD_DEFAULT
            }
            webViewClient = object : WebViewClient() {}
            webChromeClient = object : WebChromeClient() {
                override fun onShowFileChooser(
                    webView: WebView?,
                    filePathCallback: ValueCallback<Array<Uri>>?,
                    fileChooserParams: FileChooserParams?
                ): Boolean {
                    fileUploadCallback?.onReceiveValue(null)
                    fileUploadCallback = filePathCallback
                    val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = "*/*"
                    }
                    filePickerLauncher.launch(Intent.createChooser(intent, "Select Excel File"))
                    return true
                }
            }
            addJavascriptInterface(AndroidBridge(), "AndroidBridge")
        }

        setContentView(webView)
        webView.loadUrl("file:///android_asset/index.html")
    }

    private fun checkNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            } else {
                triggerImmediateCheck()
            }
        } else {
            triggerImmediateCheck()
        }
    }

    private fun scheduleDailyReminderWork() {
        val dailyWork = PeriodicWorkRequestBuilder<ReminderWorker>(24, TimeUnit.HOURS).build()
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "CRMDailyExpiryCheck",
            ExistingPeriodicWorkPolicy.KEEP,
            dailyWork
        )
    }

    private fun triggerImmediateCheck() {
        val oneTimeWork = OneTimeWorkRequestBuilder<ReminderWorker>().build()
        WorkManager.getInstance(this).enqueue(oneTimeWork)
    }

    private fun checkAutoUpdate() {
        val prefs = com.coolappstore.everdialer.by.svhp.controller.util.PreferenceManager.getInstance(this)
        if (prefs.getBoolean(com.coolappstore.everdialer.by.svhp.controller.util.PreferenceManager.KEY_AUTO_UPDATE_CHECK, true)) {
            kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.Main).launch {
                val release = com.coolappstore.everdialer.by.svhp.controller.util.fetchLatestRelease(
                    com.coolappstore.everdialer.by.svhp.GITHUB_API_RELEASES
                )
                if (release != null && com.coolappstore.everdialer.by.svhp.controller.util.isNewerVersion(
                        release.tagName,
                        com.coolappstore.everdialer.by.svhp.APP_VERSION
                    )
                ) {
                    androidx.appcompat.app.AlertDialog.Builder(this@MainActivity)
                        .setTitle("Update Available")
                        .setMessage("Mettex App V${release.tagName} is available. Would you like to view update details?")
                        .setPositiveButton("View Update") { _, _ ->
                            startActivity(Intent(this@MainActivity, UpdatesActivity::class.java))
                        }
                        .setNegativeButton("Later", null)
                        .show()
                }
            }
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    inner class AndroidBridge {
        @JavascriptInterface
        fun showToast(msg: String) {
            runOnUiThread {
                Toast.makeText(this@MainActivity, msg, Toast.LENGTH_SHORT).show()
            }
        }

        @JavascriptInterface
        fun triggerNativeCheck() {
            triggerImmediateCheck()
        }

        @JavascriptInterface
        fun openUpdateScreen() {
            runOnUiThread {
                startActivity(Intent(this@MainActivity, UpdatesActivity::class.java))
            }
        }
    }
}

