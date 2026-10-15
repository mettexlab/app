package com.ramcosta.composedestinations.annotation

import kotlin.reflect.KClass

@Target(AnnotationTarget.FUNCTION, AnnotationTarget.CLASS)
@Retention(AnnotationRetention.SOURCE)
annotation class Destination<T>(val style: KClass<*> = Any::class)

class RootGraph
