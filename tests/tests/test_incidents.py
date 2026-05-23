import pytest
from utils.config import API_BASE_URL

def test_inc_01_high_temp_incident(api_client):
    """Test Case INC-01: Generación automática de incidente por temperatura alta"""
    # Enviar telemetría con temperatura muy alta (ej: 50.0) a un envío
    res_envios = api_client.get(f"{API_BASE_URL}/envios")
    if not res_envios.json():
        pytest.skip("No hay envíos")
        
    id_envio = res_envios.json()[0]["id_envio"]
    
    # 1. Enviar telemetría extrema
    payload = {
        "id_envio": id_envio,
        "latitud": 13.69,
        "longitud": -89.24,
        "temperatura": 99.9, # Muy alta
        "humedad": 50,
        "porcentaje_bateria": 95,
        "marca_tiempo_dispositivo": "2026-05-22T22:00:00Z"
    }
    api_client.post(f"{API_BASE_URL}/telemetria", json=payload)
    
    # 2. Verificar que se creó un incidente
    res_inc = api_client.get(f"{API_BASE_URL}/incidentes?id_envio={id_envio}")
    assert res_inc.status_code == 200
    incidentes = res_inc.json()
    assert len(incidentes) > 0
    # Al menos un incidente debería ser por temperatura
    assert any(inc["tipo_incidente"] == "RUPTURA_CADENA_FRIO" for inc in incidentes)

def test_inc_02_low_battery_incident(api_client):
    """Test Case INC-02: Generación automática de incidente por batería baja"""
    res_envios = api_client.get(f"{API_BASE_URL}/envios")
    if not res_envios.json():
        pytest.skip("No hay envíos")
    id_envio = res_envios.json()[0]["id_envio"]
    
    payload = {
        "id_envio": id_envio,
        "latitud": 13.69,
        "longitud": -89.24,
        "temperatura": 5.0,
        "humedad": 50,
        "porcentaje_bateria": 4, # Menor a 5% o 15%
        "marca_tiempo_dispositivo": "2026-05-22T22:00:00Z"
    }
    api_client.post(f"{API_BASE_URL}/telemetria", json=payload)
    
    res_inc = api_client.get(f"{API_BASE_URL}/incidentes?id_envio={id_envio}")
    assert res_inc.status_code == 200
    assert any(inc["tipo_incidente"] == "BATERIA_BAJA" for inc in res_inc.json())

def test_inc_03_delete_incident_immutable(api_client):
    """Test Case INC-03: Intento de eliminar un incidente (Inmutabilidad)"""
    res_inc = api_client.get(f"{API_BASE_URL}/incidentes")
    if not res_inc.json():
        pytest.skip("No hay incidentes para borrar")
    id_incidente = res_inc.json()[0]["id_incidente"]
    
    # Intentar eliminar
    res_del = api_client.delete(f"{API_BASE_URL}/incidentes/{id_incidente}")
    assert res_del.status_code in [405, 400, 404] # No permitido o ruta no existe para DELETE
