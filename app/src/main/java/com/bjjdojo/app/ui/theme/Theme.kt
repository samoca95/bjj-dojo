package com.bjjdojo.app.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

private val DojoColorScheme = darkColorScheme(
    primary = DojoGold,
    onPrimary = DojoBlack,
    primaryContainer = DojoGoldDim,
    onPrimaryContainer = DojoGoldLight,
    secondary = DojoGray,
    onSecondary = DojoBlack,
    background = DojoBlack,
    onBackground = DojoWhite,
    surface = DojoDarkGray,
    onSurface = DojoWhite,
    surfaceVariant = DojoCard,
    onSurfaceVariant = DojoGray,
    error = DojoRed,
    outline = DojoGold.copy(alpha = 0.4f)
)

private val DojoTypography = Typography(
    headlineLarge = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize = 28.sp,
        letterSpacing = (-0.5).sp
    ),
    headlineMedium = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize = 22.sp
    ),
    titleLarge = TextStyle(
        fontWeight = FontWeight.SemiBold,
        fontSize = 18.sp
    ),
    titleMedium = TextStyle(
        fontWeight = FontWeight.Medium,
        fontSize = 16.sp
    ),
    bodyMedium = TextStyle(
        fontSize = 14.sp,
        lineHeight = 20.sp
    ),
    labelSmall = TextStyle(
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        letterSpacing = 0.5.sp
    )
)

@Composable
fun BJJDojoTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DojoColorScheme,
        typography = DojoTypography,
        content = content
    )
}
