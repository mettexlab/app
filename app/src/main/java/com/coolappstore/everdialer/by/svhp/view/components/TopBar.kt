package com.coolappstore.everdialer.by.svhp.view.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.coolappstore.everdialer.by.svhp.view.theme.wpTurnstileHeader

@Composable
fun SettingsPillTopAppBar(
    title: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    onBackClick: (() -> Unit)? = null,
    actions: @Composable (RowScope.() -> Unit)? = null
) {
    val pillBackground = MaterialTheme.colorScheme.surfaceContainerHigh.copy(alpha = 0.70f)
    val borderColor = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.30f)
    val appRoundness = LocalCardCornerRadius.current.value.coerceAtLeast(0f)
    val pillCornerRadius = (appRoundness * (36f / 28f)).dp

    Box(
        modifier = modifier
            .fillMaxWidth()
            .statusBarsPadding()
            .padding(start = 16.dp, end = 16.dp, top = 10.dp, bottom = 8.dp),
        contentAlignment = Alignment.CenterStart
    ) {
        Surface(
            modifier = Modifier.wrapContentSize().wpTurnstileHeader(),
            shape = RoundedCornerShape(pillCornerRadius),
            color = pillBackground,
            tonalElevation = 0.dp,
            shadowElevation = 0.dp,
            border = BorderStroke(1.dp, borderColor)
        ) {
            Row(
                modifier = Modifier
                    .wrapContentWidth()
                    .heightIn(min = 58.dp)
                    .padding(start = 7.dp, end = if (actions != null) 8.dp else 22.dp, top = 6.dp, bottom = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (onBackClick != null) {
                    FilledIconButton(
                        onClick = onBackClick,
                        modifier = Modifier.size(44.dp),
                        colors = IconButtonDefaults.filledIconButtonColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer,
                            contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            modifier = Modifier.size(22.dp)
                        )
                    }
                    Spacer(Modifier.width(10.dp))
                } else {
                    Spacer(Modifier.width(16.dp))
                }

                Box(
                    contentAlignment = Alignment.CenterStart
                ) {
                    ProvideTextStyle(
                        MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 20.sp,
                            color = MaterialTheme.colorScheme.primary
                        )
                    ) {
                        title()
                    }
                }

                if (actions != null) {
                    Spacer(Modifier.width(8.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        actions()
                    }
                }
            }
        }
    }
}

@Composable
fun SettingsPillTopAppBar(
    title: String,
    modifier: Modifier = Modifier,
    onBackClick: (() -> Unit)? = null,
    actions: @Composable (RowScope.() -> Unit)? = null
) {
    SettingsPillTopAppBar(
        title = {
            Text(
                text = title,
                fontWeight = FontWeight.ExtraBold,
                fontSize = 20.sp,
                color = MaterialTheme.colorScheme.primary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        },
        modifier = modifier,
        onBackClick = onBackClick,
        actions = actions
    )
}
