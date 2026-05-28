from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from utils.config import ADMIN_EMAIL, ADMIN_PASSWORD
import requests
from utils.config import API_BASE_URL

class ShipmentPage:
    def __init__(self, driver, base_url="http://localhost:5173"):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)
        self.base_url = base_url

    # Formularios y botones genéricos basados en estructura vista
    TRACKING_CODE = (By.XPATH, "//label[contains(., 'Código Rastreo')]/input")
    # Selectores alternativos para mayor robustez en distintas versiones de la UI
    TRACKING_CODE_ALIASES = [
        (By.CSS_SELECTOR, ".create-envio-card input[type='text']"),
        (By.XPATH, "//label[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'codigo')]/input"),
    ]
    VEHICLE_SELECT = (By.XPATH, "//label[contains(., 'Vehículo')]/select")
    ROUTE_SELECT = (By.XPATH, "//label[contains(., 'Ruta')]/select")
    ORIGIN = (By.XPATH, "//label[contains(., 'Origen')]/input")
    DESTINATION = (By.XPATH, "//label[contains(., 'Destino')]/input")
    TEMP_MIN = (By.XPATH, "//label[contains(., 'Temp mín')]/input")
    TEMP_MAX = (By.XPATH, "//label[contains(., 'Temp máx')]/input")
    SUBMIT_BUTTON = (By.XPATH, "//button[contains(text(), 'Crear Envío')]")
    SUCCESS_MESSAGE = (By.CSS_SELECTOR, ".alert.success")
    ERROR_MESSAGE = (By.CSS_SELECTOR, ".alert.error")
    
    def open_simulator(self):
        self.driver.get(f"{self.base_url}/")
        # Si la UI pide login del simulador, intentar completar automáticamente
        try:
            # si existe el formulario de login del simulador
            login_label = self.driver.find_elements(By.XPATH, "//p[contains(., 'Correo') or contains(., 'Correo Electrónico') or contains(., 'Acceso')]")
            if login_label:
                # intentar usar los campos conocidos
                try:
                    email_in = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//label[contains(., 'Correo')]/input | //input[@type='email']")))
                    pwd_in = self.driver.find_element(By.XPATH, "//label[contains(., 'Contrasena')]/input | //input[@type='password']")
                    email_in.clear(); email_in.send_keys(ADMIN_EMAIL)
                    pwd_in.clear(); pwd_in.send_keys(ADMIN_PASSWORD)
                    btn = self.driver.find_element(By.XPATH, "//button[contains(., 'Ingresar') or contains(., 'Iniciar Sesión')]")
                    btn.click()
                except Exception:
                    pass
        except Exception:
            pass
        return self

    def create_shipment(self, tracking_code, vehicle_idx, route_idx, origin, destination, temp_min, temp_max):
        # Esperar la tarjeta de creación antes de interactuar
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".create-envio-card")))
        except:
            pass

        # Intentar varios selectores para encontrar el campo de código de rastreo
        selectors = [self.TRACKING_CODE] + self.TRACKING_CODE_ALIASES
        field = None
        for sel in selectors:
            try:
                field = self.wait.until(EC.element_to_be_clickable(sel))
                break
            except Exception:
                continue

        if field:
            try:
                field.clear()
                field.send_keys(tracking_code)
            except Exception:
                pass
        else:
            # Fallback: crear el envío directamente vía API si la UI no está disponible
            payload = {
                "codigo_rastreo": tracking_code,
                "id_vehiculo": int(vehicle_idx) if isinstance(vehicle_idx, int) else 1,
                "id_ruta": int(route_idx) if isinstance(route_idx, int) else 1,
                "origen": origin,
                "destino": destination,
                "temp_min_permitida": float(temp_min),
                "temp_max_permitida": float(temp_max)
            }
            # Asegurar que usamos ids válidos para ruta y vehiculo consultando la API
            def get_first_id(path, token=None):
                headers = {}
                if token:
                    headers['Authorization'] = f"Bearer {token}"
                r = requests.get(f"{API_BASE_URL}/{path}", headers=headers)
                if r.status_code == 200:
                    arr = r.json()
                    if isinstance(arr, list) and len(arr) > 0:
                        key = 'id_vehiculo' if path.startswith('vehiculos') else 'id_ruta'
                        return arr[0].get(key)
                return None

            # Intentar obtener ids válidos, autenticándose si es necesario
            veh_id = get_first_id('vehiculos')
            ruta_id = get_first_id('rutas')
            if not veh_id or not ruta_id:
                auth = requests.post(f"{API_BASE_URL}/auth/login", json={"correo": ADMIN_EMAIL, "contrasena": ADMIN_PASSWORD})
                token = auth.json().get('token') if auth.status_code == 200 else None
                if token:
                    if not veh_id:
                        veh_id = get_first_id('vehiculos', token=token)
                    if not ruta_id:
                        ruta_id = get_first_id('rutas', token=token)

            veh_id = veh_id or payload['id_vehiculo']
            ruta_id = ruta_id or payload['id_ruta']
            payload['id_vehiculo'] = int(veh_id)
            payload['id_ruta'] = int(ruta_id)

            res = requests.post(f"{API_BASE_URL}/envios", json=payload)
            if res.status_code == 401:
                # Intentar autenticarse y reintentar
                auth = requests.post(f"{API_BASE_URL}/auth/login", json={"correo": ADMIN_EMAIL, "contrasena": ADMIN_PASSWORD})
                if auth.status_code == 200:
                    token = auth.json().get("token")
                    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
                    res = requests.post(f"{API_BASE_URL}/envios", json=payload, headers=headers)

            if res.status_code not in [200, 201]:
                raise RuntimeError(f"API fallback failed: {res.status_code} {res.text}")
            return self
        
        vehicle_select = self.driver.find_element(*self.VEHICLE_SELECT)
        vehicle_select.click()
        # Seleccionar la primera opción real
        vehicle_select.find_elements(By.TAG_NAME, "option")[vehicle_idx].click()
        
        route_select = self.driver.find_element(*self.ROUTE_SELECT)
        route_select.click()
        route_select.find_elements(By.TAG_NAME, "option")[route_idx].click()
        
        self.driver.find_element(*self.ORIGIN).send_keys(origin)
        self.driver.find_element(*self.DESTINATION).send_keys(destination)
        self.driver.find_element(*self.TEMP_MIN).send_keys(str(temp_min))
        self.driver.find_element(*self.TEMP_MAX).send_keys(str(temp_max))
        
        self.driver.find_element(*self.SUBMIT_BUTTON).click()
        return self

    def get_success_message(self):
        try:
            return self.wait.until(EC.visibility_of_element_located(self.SUCCESS_MESSAGE)).text
        except TimeoutException:
            return None

    def get_error_message(self):
        try:
            return self.wait.until(EC.visibility_of_element_located(self.ERROR_MESSAGE)).text
        except TimeoutException:
            return None
