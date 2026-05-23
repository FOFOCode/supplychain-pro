import pytest
import requests
from utils.config import API_BASE_URL

def test_telem_01_valid_telemetry(api_client):
    """Test Case TELEM-01: Recepción exitosa de un registro de telemetría válido"""
    # Primero necesitamos asegurarnos de que existe un envío.
    # Obtener el primer envío activo.
    res_envios = api_client.get(f"{API_BASE_URL}/envios")
    assert res_envios.status_code == 200
    envios = res_envios.json()
    if not envios:
        pytest.skip("No hay envíos activos para probar la telemetría")
        
    id_envio = envios[0]["id_envio"]
    
    payload = {
        "id_envio": id_envio,
        "latitud": 13.69,
        "longitud": -89.24,
        "temperatura": 4.5,
        "humedad": 50,
        "porcentaje_bateria": 95,
        "marca_tiempo_dispositivo": "2026-05-22T22:00:00Z"
    }
    
    res = api_client.post(f"{API_BASE_URL}/telemetria", json=payload)
    assert res.status_code == 201


def test_telem_02_invalid_latitude(api_client):
    """Test Case TELEM-02: Registro de telemetría con coordenadas fuera de rango"""
    payload = {
        "id_envio": 1,
        "latitud": 91.0, # Invalido (>90)
        "longitud": -89.24,
        "temperatura": 4.5,
        "humedad": 50,
        "porcentaje_bateria": 95
    }
    res = api_client.post(f"{API_BASE_URL}/telemetria", json=payload)
    assert res.status_code == 400

def test_telem_03_nonexistent_shipment(api_client):
    """Test Case TELEM-03: Telemetría para un ID de envío que no existe"""
    payload = {
        "id_envio": 999999,
        "latitud": 13.69,
        "longitud": -89.24,
        "temperatura": 4.5,
        "humedad": 50,
        "porcentaje_bateria": 95
    }
    res = api_client.post(f"{API_BASE_URL}/telemetria", json=payload)
    assert res.status_code in [404, 400] # Dependiendo de cómo lo maneje el backend (FK error vs 404)

def test_telem_04_missing_required_fields(api_client):
    """Test Case TELEM-04: Telemetría con campos requeridos nulos"""
    payload = {
        "id_envio": 1,
        "latitud": 13.69,
        "longitud": -89.24,
        "temperatura": None, # Requerido
        "porcentaje_bateria": 95
    }
    res = api_client.post(f"{API_BASE_URL}/telemetria", json=payload)
    assert res.status_code == 400
