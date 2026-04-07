<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HotelController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/hotel/state', [HotelController::class, 'state']);
Route::post('/hotel/book', [HotelController::class, 'book']);
Route::post('/hotel/book-exact', [HotelController::class, 'bookExact']);
Route::post('/hotel/random', [HotelController::class, 'randomOccupancy']);
Route::post('/hotel/reset', [HotelController::class, 'reset']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
});
