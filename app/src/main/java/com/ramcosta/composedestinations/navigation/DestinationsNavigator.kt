package com.ramcosta.composedestinations.navigation

interface DestinationsNavigator {
    fun navigateUp(): Boolean
    fun navigate(route: String) {}
}
