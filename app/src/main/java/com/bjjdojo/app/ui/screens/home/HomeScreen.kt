package com.bjjdojo.app.ui.screens.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bjjdojo.app.ui.theme.DojoGold
import com.bjjdojo.app.ui.theme.DojoGoldLight
import com.bjjdojo.app.ui.viewmodels.SessionViewModel

@Composable
fun HomeScreen(
    sessionViewModel: SessionViewModel,
    onNavigateSessions: () -> Unit,
    onNavigateTechniques: () -> Unit
) {
    val sessionCount by sessionViewModel.sessionCount.collectAsState()
    val totalMinutes by sessionViewModel.totalMinutes.collectAsState()
    val tapsGiven by sessionViewModel.totalTapsGiven.collectAsState()
    val tapsReceived by sessionViewModel.totalTapsReceived.collectAsState()

    val totalHours = totalMinutes / 60
    val remainingMinutes = totalMinutes % 60

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
    ) {
        // Header banner
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        listOf(Color(0xFF1A1400), MaterialTheme.colorScheme.background)
                    )
                )
                .padding(horizontal = 24.dp, vertical = 32.dp)
        ) {
            Column {
                Text(
                    text = "BJJ DOJO",
                    style = MaterialTheme.typography.headlineLarge,
                    color = DojoGold,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 4.sp
                )
                Text(
                    text = "Track your journey on the mats",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }

        // Stats row
        Spacer(Modifier.height(8.dp))
        Text(
            text = "YOUR STATS",
            style = MaterialTheme.typography.labelSmall,
            color = DojoGold,
            modifier = Modifier.padding(horizontal = 24.dp, vertical = 8.dp),
            letterSpacing = 2.sp
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(
                modifier = Modifier.weight(1f),
                label = "Sessions",
                value = sessionCount.toString(),
                icon = Icons.Filled.FitnessCenter
            )
            StatCard(
                modifier = Modifier.weight(1f),
                label = "Mat Hours",
                value = if (totalHours > 0) "${totalHours}h ${remainingMinutes}m" else "${totalMinutes}m",
                icon = Icons.Filled.Timer
            )
        }
        Spacer(Modifier.height(12.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(
                modifier = Modifier.weight(1f),
                label = "Taps Given",
                value = tapsGiven.toString(),
                icon = Icons.Filled.ThumbDown,
                iconTint = Color(0xFFD32F2F)
            )
            StatCard(
                modifier = Modifier.weight(1f),
                label = "Taps Received",
                value = tapsReceived.toString(),
                icon = Icons.Filled.ThumbUp,
                iconTint = Color(0xFF388E3C)
            )
        }

        Spacer(Modifier.height(24.dp))

        // Quick actions
        Text(
            text = "QUICK ACCESS",
            style = MaterialTheme.typography.labelSmall,
            color = DojoGold,
            modifier = Modifier.padding(horizontal = 24.dp, vertical = 8.dp),
            letterSpacing = 2.sp
        )

        QuickActionCard(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            title = "Training Sessions",
            subtitle = "Log and review your mat time",
            icon = Icons.Filled.FitnessCenter,
            onClick = onNavigateSessions
        )
        Spacer(Modifier.height(12.dp))
        QuickActionCard(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            title = "Technique Library",
            subtitle = "Browse ${60}+ techniques with YouTube refs",
            icon = Icons.Filled.LocalLibrary,
            onClick = onNavigateTechniques
        )

        Spacer(Modifier.height(32.dp))
    }
}

@Composable
private fun StatCard(
    modifier: Modifier = Modifier,
    label: String,
    value: String,
    icon: ImageVector,
    iconTint: Color = DojoGoldLight
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Icon(icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(24.dp))
            Spacer(Modifier.height(8.dp))
            Text(value, style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold)
            Text(label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun QuickActionCard(
    modifier: Modifier = Modifier,
    title: String,
    subtitle: String,
    icon: ImageVector,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .background(MaterialTheme.colorScheme.primaryContainer, RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = DojoGoldLight, modifier = Modifier.size(28.dp))
            }
            Spacer(Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Icon(Icons.Filled.ChevronRight, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
