package com.bjjdojo.app.ui.screens.sessions

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.bjjdojo.app.data.entities.Session
import com.bjjdojo.app.data.entities.SessionType
import com.bjjdojo.app.ui.theme.DojoGold
import com.bjjdojo.app.ui.viewmodels.SessionViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SessionListScreen(
    sessionViewModel: SessionViewModel,
    onAddSession: () -> Unit,
    onSessionClick: (Long) -> Unit
) {
    val sessions by sessionViewModel.sessions.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Sessions", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.onBackground
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onAddSession,
                containerColor = DojoGold,
                contentColor = Color.Black
            ) {
                Icon(Icons.Filled.Add, contentDescription = "Log Session")
            }
        }
    ) { padding ->
        if (sessions.isEmpty()) {
            EmptySessionsState(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                onAdd = onAddSession
            )
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background),
                contentPadding = padding,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item { Spacer(Modifier.height(4.dp)) }
                items(sessions, key = { it.id }) { session ->
                    SessionCard(
                        session = session,
                        onClick = { onSessionClick(session.id) },
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                }
                item { Spacer(Modifier.height(80.dp)) }
            }
        }
    }
}

@Composable
fun SessionCard(
    session: Session,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val fmt = remember { SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()) }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            // Type badge
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .background(session.sessionType.badgeColor().copy(alpha = 0.2f), RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = session.sessionType.badge(),
                    style = MaterialTheme.typography.labelSmall,
                    color = session.sessionType.badgeColor(),
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = fmt.format(Date(session.date)),
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.SemiBold
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    InfoChip(icon = Icons.Filled.Timer, text = "${session.durationMinutes} min")
                    if (session.location.isNotBlank()) {
                        InfoChip(icon = Icons.Filled.Place, text = session.location)
                    }
                }
                if (session.notes.isNotBlank()) {
                    Text(
                        text = session.notes,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 4.dp),
                        maxLines = 1
                    )
                }
            }
            // Energy dots
            Column(horizontalAlignment = Alignment.End) {
                EnergyIndicator(session.energyLevel)
            }
        }
    }
}

@Composable
private fun InfoChip(icon: ImageVector, text: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(12.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(text, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
fun EnergyIndicator(level: Int, modifier: Modifier = Modifier) {
    Row(modifier = modifier, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
        (1..5).forEach { i ->
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(
                        if (i <= level) DojoGold else MaterialTheme.colorScheme.outline,
                        RoundedCornerShape(2.dp)
                    )
            )
        }
    }
}

@Composable
private fun EmptySessionsState(modifier: Modifier, onAdd: () -> Unit) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            Icons.Filled.FitnessCenter,
            contentDescription = null,
            modifier = Modifier.size(72.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(16.dp))
        Text("No sessions yet", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
        Text("Tap + to log your first training", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(24.dp))
        Button(onClick = onAdd, colors = ButtonDefaults.buttonColors(containerColor = DojoGold, contentColor = Color.Black)) {
            Icon(Icons.Filled.Add, contentDescription = null)
            Spacer(Modifier.width(8.dp))
            Text("Log Session")
        }
    }
}

private fun SessionType.badge() = when (this) {
    SessionType.GI -> "GI"
    SessionType.NOGI -> "NOGI"
    SessionType.OPEN_MAT -> "OPEN"
    SessionType.COMPETITION -> "COMP"
    SessionType.DRILLING -> "DRILL"
}

private fun SessionType.badgeColor() = when (this) {
    SessionType.GI -> Color(0xFF1565C0)
    SessionType.NOGI -> Color(0xFF388E3C)
    SessionType.OPEN_MAT -> Color(0xFF6A1B9A)
    SessionType.COMPETITION -> Color(0xFFD32F2F)
    SessionType.DRILLING -> Color(0xFFD4A017)
}
