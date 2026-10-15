package com.coolappstore.everdialer.by.svhp.view.components

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.coolappstore.everdialer.by.svhp.controller.util.PreferenceManager
import com.coolappstore.everdialer.by.svhp.controller.util.tr
import kotlinx.coroutines.delay
import org.koin.compose.koinInject

private var lastAppHapticTime = 0L

fun performAppHaptic(
    context: Context,
    strength: String,
    customIntensity: Float = 0.5f,
    fromDirectTouch: Boolean = false
) {
    try {
        val now = android.os.SystemClock.uptimeMillis()
        if (now - lastAppHapticTime < 50L) return
        lastAppHapticTime = now

        val durationMs: Long
        val amplitude: Int
        when (strength) {
            "strong" -> { durationMs = 40; amplitude = VibrationEffect.DEFAULT_AMPLITUDE }
            "custom" -> {
                durationMs = (10 + customIntensity * 70).toLong().coerceIn(10, 80)
                amplitude = (40 + (customIntensity * 215)).toInt().coerceIn(40, 255)
            }
            else -> { durationMs = 20; amplitude = 80 }
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vm = context.getSystemService(VibratorManager::class.java)
            vm?.defaultVibrator?.vibrate(VibrationEffect.createOneShot(durationMs, amplitude))
        } else {
            val vibrator = context.getSystemService(Vibrator::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createOneShot(durationMs, amplitude))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(durationMs)
            }
        }
    } catch (_: Exception) {}
}

val LocalCardCornerRadius = compositionLocalOf { 28.dp }

@Composable
fun RivoAnimatedSection(
    delayMs: Long = 0L,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    val anim = remember { Animatable(0f) }
    LaunchedEffect(Unit) {
        if (delayMs > 0L) delay(delayMs)
        anim.animateTo(
            targetValue = 1f,
            animationSpec = tween(200, easing = androidx.compose.animation.core.FastOutSlowInEasing)
        )
    }
    Box(
        modifier = modifier.graphicsLayer {
            alpha = anim.value
            translationY = (1f - anim.value) * 14.dp.toPx()
        }
    ) {
        content()
    }
}

@Composable
fun RivoExpressiveCard(
    modifier: Modifier = Modifier,
    title: String? = null,
    icon: ImageVector? = null,
    shape: Shape = RoundedCornerShape(LocalCardCornerRadius.current),
    containerColor: Color = MaterialTheme.colorScheme.surfaceContainerLow,
    trailingContent: (@Composable () -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = shape,
        colors = CardDefaults.cardColors(containerColor = containerColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (title != null || icon != null || trailingContent != null) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp, vertical = 4.dp)
                ) {
                    if (icon != null) {
                        Icon(
                            icon, null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(Modifier.width(8.dp))
                    }
                    if (title != null) {
                        Text(
                            text = title,
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    if (trailingContent != null) {
                        Spacer(Modifier.weight(1f))
                        trailingContent()
                    }
                }
            }
            content()
        }
    }
}

@Composable
fun RivoSectionHeader(title: String, modifier: Modifier = Modifier) {
    Text(
        text = title,
        style = MaterialTheme.typography.labelLarge,
        color = MaterialTheme.colorScheme.primary,
        fontWeight = FontWeight.Bold,
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 4.dp)
    )
}

@Composable
fun RivoIconBox(
    icon: ImageVector,
    iconContainerColor: Color? = null,
    size: Dp = 44.dp,
    iconSize: Dp = 22.dp,
    shape: Shape? = null,
    modifier: Modifier = Modifier
) {
    val bgColor = iconContainerColor?.copy(alpha = 0.16f) ?: MaterialTheme.colorScheme.primaryContainer
    val fgColor = iconContainerColor ?: MaterialTheme.colorScheme.primary
    val cornerRadius = (size.value * (14f / 44f)).dp
    val defaultShape = RoundedCornerShape(cornerRadius)

    Surface(
        modifier = modifier.size(size),
        shape = shape ?: defaultShape,
        color = bgColor,
        shadowElevation = 0.dp
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(
                icon, null,
                tint = fgColor,
                modifier = Modifier.size(iconSize)
            )
        }
    }
}

@Composable
fun RivoListItem(
    headline: String,
    supporting: String? = null,
    headlineMaxLines: Int = 1,
    leadingIcon: ImageVector? = null,
    iconContainerColor: Color? = null,
    trailingIcon: ImageVector? = null,
    trailingIconTint: Color? = null,
    trailingIconContainerColor: Color? = null,
    trailingText: String? = null,
    trailingTextColor: Color? = null,
    trailingSubText: String? = null,
    trailingSubTextColor: Color? = null,
    trailingStartContent: (@Composable () -> Unit)? = null,
    headlineStartContent: (@Composable () -> Unit)? = null,
    supportingStartContent: (@Composable () -> Unit)? = null,
    headlineEndContent: (@Composable () -> Unit)? = null,
    supportingEndContent: (@Composable () -> Unit)? = null,
    avatarName: String? = null,
    avatarForcePersonIcon: Boolean = false,
    photoUri: String? = null,
    avatarObeySolidIcons: Boolean = true,
    onClick: () -> Unit,
    onAvatarClick: (() -> Unit)? = null,
    onLongClick: (() -> Unit)? = null,
    isMenuOpen: Boolean = false,
    compact: Boolean = false,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val prefs = koinInject<PreferenceManager>()
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isMenuOpen) 0.97f else if (isPressed) 0.95f else 1f,
        animationSpec = spring(stiffness = Spring.StiffnessLow, dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "ListItemScale"
    )

    Surface(
        color = Color.Transparent,
        modifier = modifier
            .fillMaxWidth()
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            },
        shadowElevation = 0.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape((LocalCardCornerRadius.current.value.coerceAtLeast(0f) * (16f / 28f)).dp))
                .clickable(
                    interactionSource = interactionSource,
                    indication = null,
                    onClick = {
                        if (prefs.getBoolean(PreferenceManager.KEY_APP_HAPTICS, true)) {
                            performAppHaptic(
                                context,
                                prefs.getString(PreferenceManager.KEY_APP_HAPTICS_STRENGTH, "light") ?: "light",
                                prefs.getFloat(PreferenceManager.KEY_HAPTICS_CUSTOM_INTENSITY, 0.5f)
                            )
                        }
                        onClick()
                    }
                )
                .padding(horizontal = 12.dp, vertical = if (compact) 6.dp else 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (leadingIcon != null) {
                RivoIconBox(
                    icon = leadingIcon,
                    iconContainerColor = iconContainerColor
                )
                Spacer(modifier = Modifier.width(16.dp))
            }

            val displayHeadline = tr(headline)
            val displaySupporting = supporting?.let { tr(it) }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = displayHeadline,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = headlineMaxLines,
                    overflow = TextOverflow.Ellipsis
                )
                if (displaySupporting != null) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = displaySupporting,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            if (trailingIcon != null) {
                Spacer(modifier = Modifier.width(12.dp))
                Icon(
                    trailingIcon, null,
                    tint = trailingIconTint ?: MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}

@Composable
fun RivoSwitchListItem(
    headline: String,
    supporting: String? = null,
    leadingIcon: ImageVector? = null,
    iconContainerColor: Color? = null,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    val context = LocalContext.current
    val prefs = koinInject<PreferenceManager>()
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isPressed && enabled) 0.98f else 1f,
        animationSpec = spring(stiffness = Spring.StiffnessMedium),
        label = "SwitchItemScale"
    )

    Surface(
        color = Color.Transparent,
        modifier = modifier
            .fillMaxWidth()
            .scale(scale)
            .then(if (!enabled) Modifier.alpha(0.38f) else Modifier)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                enabled = enabled,
                onClick = {
                    if (prefs.getBoolean(PreferenceManager.KEY_APP_HAPTICS, true)) {
                        performAppHaptic(
                            context,
                            prefs.getString(PreferenceManager.KEY_APP_HAPTICS_STRENGTH, "light") ?: "light",
                            prefs.getFloat(PreferenceManager.KEY_HAPTICS_CUSTOM_INTENSITY, 0.5f)
                        )
                    }
                    onCheckedChange(!checked)
                }
            ),
        shape = RoundedCornerShape((LocalCardCornerRadius.current.value.coerceAtLeast(0f) * (16f / 28f)).dp),
        shadowElevation = 0.dp
    ) {
        Row(
            modifier = Modifier
                .padding(horizontal = 12.dp, vertical = 10.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (leadingIcon != null) {
                RivoIconBox(
                    icon = leadingIcon,
                    iconContainerColor = iconContainerColor
                )
                Spacer(modifier = Modifier.width(16.dp))
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = tr(headline),
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                if (supporting != null) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = tr(supporting),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            Switch(
                checked = checked,
                onCheckedChange = {
                    if (prefs.getBoolean(PreferenceManager.KEY_APP_HAPTICS, true)) {
                        performAppHaptic(
                            context,
                            prefs.getString(PreferenceManager.KEY_APP_HAPTICS_STRENGTH, "light") ?: "light",
                            prefs.getFloat(PreferenceManager.KEY_HAPTICS_CUSTOM_INTENSITY, 0.5f)
                        )
                    }
                    onCheckedChange(it)
                },
                enabled = enabled
            )
        }
    }
}
