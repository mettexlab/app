package com.crm.reminder

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import org.json.JSONArray
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class ReminderWorker(
    private val context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    companion object {
        const val CHANNEL_ID = "crm_reminder_channel"
        const val NOTIFICATION_ID = 1001

        fun createNotificationChannel(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val name = "CRM Expiry Reminders"
                val descriptionText = "Alerts for antibiotics expiring within 1 month"
                val importance = NotificationManager.IMPORTANCE_HIGH
                val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                    description = descriptionText
                    enableVibration(true)
                }
                val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                notificationManager.createNotificationChannel(channel)
            }
        }
    }

    override suspend fun doWork(): Result {
        createNotificationChannel(context)
        checkExpirationsAndNotify()
        return Result.success()
    }

    private fun checkExpirationsAndNotify() {
        try {
            val jsonString = context.assets.open("antibiotics_crm.json").bufferedReader().use { it.readText() }
            val jsonArray = JSONArray(jsonString)

            val urgentItems = mutableListOf<String>()
            val today = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }.time

            val sdfDot = SimpleDateFormat("dd.MM.yyyy", Locale.US)
            val sdfDash = SimpleDateFormat("dd-MM-yyyy", Locale.US)
            val sdfSlash = SimpleDateFormat("dd/MM/yyyy", Locale.US)
            val sdfIso = SimpleDateFormat("yyyy-MM-dd", Locale.US)

            for (i in 0 until jsonArray.length()) {
                val item = jsonArray.getJSONObject(i)
                val rawExp = item.optString("rawExpiry", "").trim()
                val name = item.optString("name", "Unknown Standard")
                val code = item.optString("code", "")

                val expDate: Date? = parseDate(rawExp, sdfDot, sdfDash, sdfSlash, sdfIso)
                if (expDate != null) {
                    val diffMs = expDate.time - today.time
                    val daysLeft = (diffMs / (1000 * 60 * 60 * 24)).toInt()

                    // 1-month reminder window: 0 to 30 days remaining
                    if (daysLeft in 0..30) {
                        val label = if (code.isNotEmpty()) "$name ($code)" else name
                        urgentItems.add("$label - $daysLeft days left")
                    }
                }
            }

            if (urgentItems.isNotEmpty()) {
                postNotification(urgentItems)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun parseDate(raw: String, vararg formats: SimpleDateFormat): Date? {
        if (raw.isEmpty()) return null
        for (f in formats) {
            try {
                return f.parse(raw)
            } catch (_: Exception) {}
        }
        return null
    }

    private fun postNotification(urgentList: List<String>) {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val title = "⚠️ CRM Expiry Reminder: ${urgentList.size} Antibiotics Due!"
        val preview = urgentList.take(3).joinToString("; ")
        val bodyText = if (urgentList.size > 3) "$preview (+${urgentList.size - 3} more)" else preview

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle(title)
            .setContentText(bodyText)
            .setStyle(NotificationCompat.BigTextStyle().bigText(
                "The following antibiotic standards are expiring within 30 days:\n\n" +
                urgentList.joinToString("\n• ", prefix = "• ")
            ))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, builder.build())
    }
}
