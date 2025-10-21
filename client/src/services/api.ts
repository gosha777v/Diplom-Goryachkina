export const BASE_URL = "http://localhost:3001";

export type LoginData = {
  login: string;
  password: string;
};

export type RegistrationData = {
  login: string;
  password: string;
  role?: string;
  profileData?: {
    full_name?: string;
    company_name?: string;
    phone?: string;
    company_legal_address?: string;
    company_tax_id?: string;
  };
};

export type CargoType = {
  type_id: number;
  name: string;
  description: string;
  base_price_per_kg: number;
  base_price_per_m3: number;
  requires_temperature: boolean;
};

export type CityPrice = {
  city_id: number;
  city_name: string;
  price_multiplier: number;
};

export type CalculationRequest = {
  cargo_type_id: number;
  weight_kg?: number;
  volume_m3?: number;
  city_to: string;
};

export type CalculationResult = {
  calculation_id: number;
  calculated_price: number;
  base_price: number;
  city_multiplier: number;
  formula: string;
};

export type Address = {
  address_id: number;
  user_id: number;
  full_address: string;
  address_type: 'pickup' | 'delivery';
  city: string;
  contact_person: string;
  contact_phone: string;
  is_default: boolean;
  created_at: string;
};

export type Order = {
  order_id: number;
  user_id: number;
  calculation_id?: number;
  order_number: string;
  status: string;
  customer_full_name: string;
  customer_phone: string;
  pickup_address_id: number;
  delivery_address_id: number;
  cargo_description: string;
  cargo_type_id: number;
  quantity_places?: number;
  weight_kg?: number;
  volume_m3?: number;
  dimensions?: string;
  declared_value?: number;
  temperature_requirements?: string;
  total_price: number;
  payment_method?: string;
  assigned_delivery_time?: string;
  assigned_location?: string;
  created_at: string;
  updated_at: string;
  cargo_type_name?: string;
  pickup_address?: string;
  delivery_address?: string;
  current_status?: string;
};

export type CreateOrderData = {
  calculation_id?: number;
  customer_full_name: string;
  customer_phone: string;
  pickup_address_id: number;
  delivery_address_id: number;
  cargo_description: string;
  cargo_type_id: number;
  quantity_places?: number;
  weight_kg?: number;
  volume_m3?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  declared_value?: number;
  temperature_requirements?: string;
  total_price: number;
  payment_method?: string;
};

const errorHandler = async (response: Response) => {
  if (response.status !== 200 && response.status !== 201) {
    const responseData = await response.json();
    throw new Error(responseData.message || "Произошла ошибка");
  }
};

export const API = {
  auth: {
    login: async (data: LoginData) => {
      const response = await fetch(`${BASE_URL}/auth`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      await errorHandler(response);
      return await response.json();
    },
    logout: async () => {
      const response = await fetch(`${BASE_URL}/auth`, {
        method: "DELETE",
        credentials: "include",
      });
      await errorHandler(response);
      return await response.json();
    },
    register: async (data: RegistrationData) => {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      await errorHandler(response);
      return await response.json();
    },
    check: async () => {
      const response = await fetch(`${BASE_URL}/auth/check`, {
        credentials: "include",
        method: "GET"
      });
      await errorHandler(response);
      return await response.json();
    },
  },
  user: {
    getCurrentUser: async () => {
      const response = await fetch(`${BASE_URL}/user`, {
        credentials: "include",
        method: "GET"
      });
      await errorHandler(response);
      return await response.json();
    },
    updateProfile: async (data: any) => {
      const response = await fetch(`${BASE_URL}/user/profile`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      await errorHandler(response);
      return await response.json();
    },
    getAllUsers: async () => {
      const response = await fetch(`${BASE_URL}/user/all`, {
        credentials: "include",
        method: "GET"
      });
      await errorHandler(response);
      return await response.json();
    },
    getUsersByRole: async (role: string) => {
      const response = await fetch(`${BASE_URL}/user/role/${role}`, {
        credentials: "include",
        method: "GET"
      });
      await errorHandler(response);
      return await response.json();
    },
    updateUserRole: async (userId: number, role: string) => {
      const response = await fetch(`${BASE_URL}/user/${userId}/role`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role })
      });
      await errorHandler(response);
      return await response.json();
    },
  },
  cargo: {
    getCargoTypes: async (): Promise<CargoType[]> => {
      const response = await fetch(`${BASE_URL}/cargo/types`, {
        credentials: "include",
        method: "GET"
      });
      await errorHandler(response);
      return await response.json();
    },
    getCities: async (): Promise<CityPrice[]> => {
      const response = await fetch(`${BASE_URL}/cargo/cities`, {
        credentials: "include",
        method: "GET"
      });
      await errorHandler(response);
      return await response.json();
    },
    calculatePrice: async (data: CalculationRequest): Promise<CalculationResult> => {
      const response = await fetch(`${BASE_URL}/cargo/calculate`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      await errorHandler(response);
      return await response.json();
    },
    getUserAddresses: async (): Promise<Address[]> => {
      const response = await fetch(`${BASE_URL}/cargo/addresses`, {
        credentials: "include",
        method: "GET"
      });
      await errorHandler(response);
      return await response.json();
    },
    addAddress: async (data: Omit<Address, 'address_id' | 'user_id' | 'created_at'>): Promise<{ address_id: number }> => {
      const response = await fetch(`${BASE_URL}/cargo/addresses`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      await errorHandler(response);
      return await response.json();
    },
    createOrder: async (data: CreateOrderData): Promise<{ order_id: number; order_number: string }> => {
      const response = await fetch(`${BASE_URL}/cargo/orders`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      await errorHandler(response);
      return await response.json();
    },
    getUserOrders: async (): Promise<Order[]> => {
      const response = await fetch(`${BASE_URL}/cargo/orders`, {
        credentials: "include",
        method: "GET"
      });
      await errorHandler(response);
      return await response.json();
    },
    getOrderById: async (orderId: number): Promise<Order> => {
      const response = await fetch(`${BASE_URL}/cargo/orders/${orderId}`, {
        credentials: "include",
        method: "GET"
      });
      await errorHandler(response);
      return await response.json();
    },
    getAllOrders: async (): Promise<Order[]> => {
      const response = await fetch(`${BASE_URL}/cargo/admin/orders`, {
        credentials: "include",
        method: "GET"
      });
      await errorHandler(response);
      return await response.json();
    },
    updateOrderStatus: async (orderId: number, status: string, notes?: string) => {
      const response = await fetch(`${BASE_URL}/cargo/admin/orders/${orderId}/status`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status, notes })
      });
      await errorHandler(response);
      return await response.json();
    },
  },
};