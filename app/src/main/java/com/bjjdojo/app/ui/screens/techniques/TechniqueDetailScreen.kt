package com.bjjdojo.app.ui.screens.techniques

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.sp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.bjjdojo.app.data.entities.ConnectionType
import com.bjjdojo.app.data.entities.Technique
import com.bjjdojo.app.data.entities.TechniqueConnection
import com.bjjdojo.app.ui.theme.DojoGold
import com.bjjdojo.app.ui.theme.DojoGoldLight
import com.bjjdojo.app.ui.viewmodels.SessionViewModel
import com.bjjdojo.app.ui.viewmodels.TechniqueViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TechniqueDetailScreen(
    techniqueId: Long,
    techniqueViewModel: TechniqueViewModel,
    sessionViewModel: SessionViewModel,
    onBack: () -> Unit,
    onTechniqueClick: (Long) -> Unit
) {
    var technique by remember { mutableStateOf<Technique?>(null) }
    var categoryName by remember { mutableStateOf("") }

    val connectedFrom by techniqueViewModel.getConnectedFrom(techniqueId).collectAsState()
    val connectedTo by techniqueViewModel.getConnectedTo(techniqueId).collectAsState()
    val connections by techniqueViewModel.getConnectionsForTechnique(techniqueId).collectAsState()
    val sessionCount by sessionViewModel.getSessionCountForTechnique(techniqueId).collectAsState()

    val context = LocalContext.current

    LaunchedEffect(techniqueId) {
        technique = techniqueViewModel.getTechniqueById(techniqueId)
        technique?.let { t ->
            categoryName = techniqueViewModel.getCategoryById(t.categoryId)?.name ?: ""
        }
    }

    val t = technique ?: run {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = DojoGold)
        }
        return
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(t.name, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, "Back") }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.onBackground
                )
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item { Spacer(Modifier.height(4.dp)) }

            // Header card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(20.dp)
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                color = MaterialTheme.colorScheme.primaryContainer,
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    categoryName,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = DojoGoldLight,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                            DifficultyBadge(t.difficulty)
                            if (sessionCount > 0) {
                                Surface(
                                    color = Color(0xFF1565C0).copy(alpha = 0.15f),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text(
                                        "Practiced $sessionCount×",
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Color(0xFF90CAF9),
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }
                        }
                        Spacer(Modifier.height(12.dp))
                        Text(
                            t.description,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                            lineHeight = 22.sp
                        )
                    }
                }
            }

            // YouTube button
            item {
                Button(
                    onClick = {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(t.youtubeUrl))
                        context.startActivity(intent)
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFFCC0000),
                        contentColor = Color.White
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Filled.PlayCircle, contentDescription = null)
                    Spacer(Modifier.width(10.dp))
                    Text("Watch on YouTube", fontWeight = FontWeight.SemiBold)
                }
            }

            // Connections graph section
            if (connectedFrom.isNotEmpty() || connectedTo.isNotEmpty()) {
                item {
                    Text(
                        "TECHNIQUE CONNECTIONS",
                        style = MaterialTheme.typography.labelSmall,
                        color = DojoGold,
                        letterSpacing = 1.5.sp
                    )
                }
            }

            // Leads to (follow-ups from this technique)
            if (connectedFrom.isNotEmpty()) {
                item {
                    ConnectionSection(
                        title = "Leads To / Follow-ups",
                        icon = Icons.Filled.ArrowForward,
                        techniques = connectedFrom,
                        connections = connections,
                        fromId = techniqueId,
                        onTechniqueClick = onTechniqueClick
                    )
                }
            }

            // Sets up / counters this technique
            if (connectedTo.isNotEmpty()) {
                item {
                    ConnectionSection(
                        title = "Can Be Set Up From",
                        icon = Icons.Filled.ArrowBack,
                        techniques = connectedTo,
                        connections = connections,
                        toId = techniqueId,
                        onTechniqueClick = onTechniqueClick
                    )
                }
            }

            item { Spacer(Modifier.height(32.dp)) }
        }
    }
}

@Composable
private fun ConnectionSection(
    title: String,
    icon: ImageVector,
    techniques: List<Technique>,
    connections: List<TechniqueConnection>,
    fromId: Long? = null,
    toId: Long? = null,
    onTechniqueClick: (Long) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(icon, contentDescription = null, tint = DojoGold, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text(title, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
            }
            Spacer(Modifier.height(12.dp))
            techniques.forEach { technique ->
                val connectionType = when {
                    fromId != null -> connections
                        .find { it.fromTechniqueId == fromId && it.toTechniqueId == technique.id }
                        ?.connectionType
                    toId != null -> connections
                        .find { it.toTechniqueId == toId && it.fromTechniqueId == technique.id }
                        ?.connectionType
                    else -> null
                }
                ConnectedTechniqueRow(
                    technique = technique,
                    connectionType = connectionType,
                    onClick = { onTechniqueClick(technique.id) }
                )
                Spacer(Modifier.height(8.dp))
            }
        }
    }
}

@Composable
private fun ConnectedTechniqueRow(
    technique: Technique,
    connectionType: ConnectionType?,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(MaterialTheme.colorScheme.surface)
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        connectionType?.let { ct ->
            Surface(
                color = ct.color().copy(alpha = 0.15f),
                shape = RoundedCornerShape(4.dp)
            ) {
                Text(
                    ct.label(),
                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                    style = MaterialTheme.typography.labelSmall,
                    color = ct.color(),
                    fontWeight = FontWeight.SemiBold
                )
            }
            Spacer(Modifier.width(10.dp))
        }
        Text(
            technique.name,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.weight(1f)
        )
        Icon(
            Icons.Filled.ChevronRight,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(16.dp)
        )
    }
}

private fun ConnectionType.label() = when (this) {
    ConnectionType.FOLLOW_UP -> "Follow-up"
    ConnectionType.COUNTER -> "Counter"
    ConnectionType.SETUP -> "Setup"
    ConnectionType.TRANSITION -> "Transition"
}

private fun ConnectionType.color() = when (this) {
    ConnectionType.FOLLOW_UP -> Color(0xFFD4A017)
    ConnectionType.COUNTER -> Color(0xFFD32F2F)
    ConnectionType.SETUP -> Color(0xFF388E3C)
    ConnectionType.TRANSITION -> Color(0xFF1565C0)
}
