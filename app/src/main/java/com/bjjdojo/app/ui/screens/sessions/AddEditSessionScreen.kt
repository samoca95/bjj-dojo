package com.bjjdojo.app.ui.screens.sessions

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.ui.unit.sp
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.bjjdojo.app.data.entities.Session
import com.bjjdojo.app.data.entities.SessionType
import com.bjjdojo.app.ui.theme.DojoGold
import com.bjjdojo.app.ui.viewmodels.SessionViewModel
import com.bjjdojo.app.ui.viewmodels.TechniqueViewModel
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditSessionScreen(
    sessionId: Long?,
    sessionViewModel: SessionViewModel,
    techniqueViewModel: TechniqueViewModel,
    onSaved: () -> Unit,
    onBack: () -> Unit
) {
    val isEdit = sessionId != null
    var loaded by remember { mutableStateOf(false) }

    var date by remember { mutableLongStateOf(System.currentTimeMillis()) }
    var duration by remember { mutableStateOf("60") }
    var sessionType by remember { mutableStateOf(SessionType.GI) }
    var location by remember { mutableStateOf("") }
    var partners by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    var energyLevel by remember { mutableIntStateOf(3) }
    var tapsGiven by remember { mutableStateOf("0") }
    var tapsReceived by remember { mutableStateOf("0") }
    var selectedTechniqueIds by remember { mutableStateOf(setOf<Long>()) }
    var showTechniquePicker by remember { mutableStateOf(false) }

    val allTechniques by techniqueViewModel.techniques.collectAsState()

    LaunchedEffect(sessionId) {
        if (sessionId != null && !loaded) {
            val session = sessionViewModel.getSessionById(sessionId) ?: return@LaunchedEffect
            date = session.date
            duration = session.durationMinutes.toString()
            sessionType = session.sessionType
            location = session.location
            partners = session.partners
            notes = session.notes
            energyLevel = session.energyLevel
            tapsGiven = session.tapsGiven.toString()
            tapsReceived = session.tapsReceived.toString()
            selectedTechniqueIds = sessionViewModel.getSessionTechniqueIds(sessionId).toSet()
            loaded = true
        }
    }

    if (showTechniquePicker) {
        TechniquePickerDialog(
            allTechniques = allTechniques,
            selectedIds = selectedTechniqueIds,
            onDismiss = { showTechniquePicker = false },
            onConfirm = { ids ->
                selectedTechniqueIds = ids
                showTechniquePicker = false
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (isEdit) "Edit Session" else "Log Session", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.onBackground
                ),
                actions = {
                    TextButton(
                        onClick = {
                            val session = Session(
                                id = sessionId ?: 0,
                                date = date,
                                durationMinutes = duration.toIntOrNull() ?: 60,
                                sessionType = sessionType,
                                location = location.trim(),
                                partners = partners.trim(),
                                notes = notes.trim(),
                                energyLevel = energyLevel,
                                tapsGiven = tapsGiven.toIntOrNull() ?: 0,
                                tapsReceived = tapsReceived.toIntOrNull() ?: 0
                            )
                            if (isEdit) {
                                sessionViewModel.updateSession(session, selectedTechniqueIds.toList())
                            } else {
                                sessionViewModel.saveSession(session, selectedTechniqueIds.toList())
                            }
                            onSaved()
                        }
                    ) {
                        Text("Save", color = DojoGold, fontWeight = FontWeight.Bold)
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .verticalScroll(rememberScrollState())
                .padding(padding)
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Session type selector
            SectionLabel("Session Type")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                SessionType.entries.forEach { type ->
                    FilterChip(
                        selected = sessionType == type,
                        onClick = { sessionType = type },
                        label = { Text(type.name.replace("_", " "), style = MaterialTheme.typography.labelSmall) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = DojoGold,
                            selectedLabelColor = Color.Black
                        )
                    )
                }
            }

            // Duration
            SectionLabel("Duration (minutes)")
            OutlinedTextField(
                value = duration,
                onValueChange = { duration = it },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true,
                colors = dojoTextFieldColors()
            )

            // Location
            SectionLabel("Location (optional)")
            OutlinedTextField(
                value = location,
                onValueChange = { location = it },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("e.g. Main Dojo, Competition") },
                singleLine = true,
                colors = dojoTextFieldColors()
            )

            // Partners
            SectionLabel("Training Partners (optional)")
            OutlinedTextField(
                value = partners,
                onValueChange = { partners = it },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("e.g. John, Sarah") },
                singleLine = true,
                colors = dojoTextFieldColors()
            )

            // Energy level
            SectionLabel("Energy Level")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                (1..5).forEach { level ->
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(
                                if (level <= energyLevel) DojoGold else MaterialTheme.colorScheme.surfaceVariant,
                                RoundedCornerShape(8.dp)
                            )
                            .clickable { energyLevel = level },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            "$level",
                            color = if (level <= energyLevel) Color.Black else MaterialTheme.colorScheme.onSurfaceVariant,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                Spacer(Modifier.width(8.dp))
                Text(
                    text = when (energyLevel) {
                        1 -> "Exhausted"
                        2 -> "Low"
                        3 -> "Average"
                        4 -> "Good"
                        5 -> "Peak"
                        else -> ""
                    },
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Taps
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Column(modifier = Modifier.weight(1f)) {
                    SectionLabel("Taps Given")
                    OutlinedTextField(
                        value = tapsGiven,
                        onValueChange = { tapsGiven = it },
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        colors = dojoTextFieldColors()
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    SectionLabel("Taps Received")
                    OutlinedTextField(
                        value = tapsReceived,
                        onValueChange = { tapsReceived = it },
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        colors = dojoTextFieldColors()
                    )
                }
            }

            // Techniques
            SectionLabel("Techniques Practiced")
            OutlinedButton(
                onClick = { showTechniquePicker = true },
                modifier = Modifier.fillMaxWidth(),
                border = ButtonDefaults.outlinedButtonBorder.copy(
                    brush = SolidColor(DojoGold.copy(alpha = 0.5f))
                )
            ) {
                Icon(Icons.Filled.Add, contentDescription = null, tint = DojoGold)
                Spacer(Modifier.width(8.dp))
                Text(
                    if (selectedTechniqueIds.isEmpty()) "Add Techniques"
                    else "${selectedTechniqueIds.size} technique(s) selected",
                    color = DojoGold
                )
            }

            // Notes
            SectionLabel("Notes")
            OutlinedTextField(
                value = notes,
                onValueChange = { notes = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp),
                placeholder = { Text("What did you work on? Any insights?") },
                colors = dojoTextFieldColors()
            )

            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.labelSmall,
        color = DojoGold,
        letterSpacing = 1.sp
    )
}

@Composable
private fun dojoTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = DojoGold,
    unfocusedBorderColor = MaterialTheme.colorScheme.outline,
    focusedTextColor = MaterialTheme.colorScheme.onSurface,
    unfocusedTextColor = MaterialTheme.colorScheme.onSurface
)

@Composable
private fun TechniquePickerDialog(
    allTechniques: List<com.bjjdojo.app.data.entities.Technique>,
    selectedIds: Set<Long>,
    onDismiss: () -> Unit,
    onConfirm: (Set<Long>) -> Unit
) {
    var localSelected by remember { mutableStateOf(selectedIds) }
    var search by remember { mutableStateOf("") }

    val filtered = if (search.isBlank()) allTechniques
    else allTechniques.filter { it.name.contains(search, ignoreCase = true) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.8f),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Select Techniques", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = search,
                    onValueChange = { search = it },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Search…") },
                    leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
                    singleLine = true,
                    colors = dojoTextFieldColors()
                )
                Spacer(Modifier.height(8.dp))
                LazyColumn(modifier = Modifier.weight(1f)) {
                    items(filtered, key = { it.id }) { technique ->
                        val selected = technique.id in localSelected
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    localSelected = if (selected)
                                        localSelected - technique.id
                                    else
                                        localSelected + technique.id
                                }
                                .padding(vertical = 8.dp, horizontal = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Checkbox(
                                checked = selected,
                                onCheckedChange = null,
                                colors = CheckboxDefaults.colors(checkedColor = DojoGold)
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(technique.name, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
                        }
                        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
                    }
                }
                Spacer(Modifier.height(8.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = onDismiss) { Text("Cancel") }
                    Spacer(Modifier.width(8.dp))
                    Button(
                        onClick = { onConfirm(localSelected) },
                        colors = ButtonDefaults.buttonColors(containerColor = DojoGold, contentColor = Color.Black)
                    ) { Text("Confirm (${localSelected.size})") }
                }
            }
        }
    }
}
