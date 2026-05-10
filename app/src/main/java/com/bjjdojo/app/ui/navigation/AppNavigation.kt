package com.bjjdojo.app.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.ui.unit.dp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import com.bjjdojo.app.ui.screens.home.HomeScreen
import com.bjjdojo.app.ui.screens.sessions.AddEditSessionScreen
import com.bjjdojo.app.ui.screens.sessions.SessionDetailScreen
import com.bjjdojo.app.ui.screens.sessions.SessionListScreen
import com.bjjdojo.app.ui.screens.techniques.TechniqueDetailScreen
import com.bjjdojo.app.ui.screens.techniques.TechniqueListScreen
import com.bjjdojo.app.ui.viewmodels.SessionViewModel
import com.bjjdojo.app.ui.viewmodels.TechniqueViewModel

sealed class Screen(val route: String) {
    object Home : Screen("home")
    object Sessions : Screen("sessions")
    object SessionDetail : Screen("session/{id}") {
        fun route(id: Long) = "session/$id"
    }
    object AddSession : Screen("session/add")
    object EditSession : Screen("session/edit/{id}") {
        fun route(id: Long) = "session/edit/$id"
    }
    object Techniques : Screen("techniques")
    object TechniqueDetail : Screen("technique/{id}") {
        fun route(id: Long) = "technique/$id"
    }
}

data class BottomNavItem(
    val label: String,
    val icon: ImageVector,
    val route: String
)

private val bottomNavItems = listOf(
    BottomNavItem("Home", Icons.Filled.Home, Screen.Home.route),
    BottomNavItem("Sessions", Icons.Filled.FitnessCenter, Screen.Sessions.route),
    BottomNavItem("Techniques", Icons.Filled.LocalLibrary, Screen.Techniques.route)
)

@Composable
fun AppNavigation(
    sessionViewModel: SessionViewModel,
    techniqueViewModel: TechniqueViewModel
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val showBottomBar = bottomNavItems.any { it.route == currentRoute }

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(
                    containerColor = MaterialTheme.colorScheme.surface,
                    tonalElevation = 0.dp
                ) {
                    bottomNavItems.forEach { item ->
                        NavigationBarItem(
                            selected = currentRoute == item.route,
                            onClick = {
                                navController.navigate(item.route) {
                                    popUpTo(navController.graph.startDestinationId) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(item.icon, contentDescription = item.label) },
                            label = { Text(item.label) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = MaterialTheme.colorScheme.primary,
                                selectedTextColor = MaterialTheme.colorScheme.primary,
                                indicatorColor = MaterialTheme.colorScheme.primaryContainer
                            )
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Home.route) {
                HomeScreen(
                    sessionViewModel = sessionViewModel,
                    onNavigateSessions = { navController.navigate(Screen.Sessions.route) },
                    onNavigateTechniques = { navController.navigate(Screen.Techniques.route) }
                )
            }
            composable(Screen.Sessions.route) {
                SessionListScreen(
                    sessionViewModel = sessionViewModel,
                    onAddSession = { navController.navigate(Screen.AddSession.route) },
                    onSessionClick = { navController.navigate(Screen.SessionDetail.route(it)) }
                )
            }
            composable(
                route = Screen.SessionDetail.route,
                arguments = listOf(navArgument("id") { type = NavType.LongType })
            ) { backStack ->
                val id = backStack.arguments!!.getLong("id")
                SessionDetailScreen(
                    sessionId = id,
                    sessionViewModel = sessionViewModel,
                    techniqueViewModel = techniqueViewModel,
                    onEdit = { navController.navigate(Screen.EditSession.route(id)) },
                    onBack = { navController.popBackStack() },
                    onTechniqueClick = { navController.navigate(Screen.TechniqueDetail.route(it)) }
                )
            }
            composable(Screen.AddSession.route) {
                AddEditSessionScreen(
                    sessionId = null,
                    sessionViewModel = sessionViewModel,
                    techniqueViewModel = techniqueViewModel,
                    onSaved = { navController.popBackStack() },
                    onBack = { navController.popBackStack() }
                )
            }
            composable(
                route = Screen.EditSession.route,
                arguments = listOf(navArgument("id") { type = NavType.LongType })
            ) { backStack ->
                val id = backStack.arguments!!.getLong("id")
                AddEditSessionScreen(
                    sessionId = id,
                    sessionViewModel = sessionViewModel,
                    techniqueViewModel = techniqueViewModel,
                    onSaved = { navController.popBackStack() },
                    onBack = { navController.popBackStack() }
                )
            }
            composable(Screen.Techniques.route) {
                TechniqueListScreen(
                    viewModel = techniqueViewModel,
                    onTechniqueClick = { navController.navigate(Screen.TechniqueDetail.route(it)) }
                )
            }
            composable(
                route = Screen.TechniqueDetail.route,
                arguments = listOf(navArgument("id") { type = NavType.LongType })
            ) { backStack ->
                val id = backStack.arguments!!.getLong("id")
                TechniqueDetailScreen(
                    techniqueId = id,
                    techniqueViewModel = techniqueViewModel,
                    sessionViewModel = sessionViewModel,
                    onBack = { navController.popBackStack() },
                    onTechniqueClick = { navController.navigate(Screen.TechniqueDetail.route(it)) }
                )
            }
        }
    }
}
