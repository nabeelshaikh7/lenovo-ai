import { supabase } from './supabase'

export async function post(endpoint: string, payload: object) {
  // Get the current user's session from Supabase
  const session = await supabase.auth.getSession()

  // If there's no session or access token, throw an error
  if (!session.data.session?.access_token) {
    throw new Error('No active session found. Please log in.')
  }

  // Construct the full API URL by combining import.meta.env.VITE_API_BASE_URL and the endpoint
  const fullUrl = `${import.meta.env.VITE_API_BASE_URL}${endpoint}`

  // Use the fetch API to make a POST request to the full URL
  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.data.session.access_token}`
    },
    body: JSON.stringify(payload)
  })

  // If the response is not ok, throw an error
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  // Parse the JSON from the response and return it
  return await response.json()
}

export async function get(endpoint: string) {
  // Get the current user's session from Supabase
  const session = await supabase.auth.getSession()

  // If there's no session or access token, throw an error
  if (!session.data.session?.access_token) {
    throw new Error('No active session found. Please log in.')
  }

  // Construct the full API URL by combining import.meta.env.VITE_API_BASE_URL and the endpoint
  const fullUrl = `${import.meta.env.VITE_API_BASE_URL}${endpoint}`

  // Use the fetch API to make a GET request to the full URL
  const response = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.data.session.access_token}`
    }
  })

  // If the response is not ok, throw an error
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  // Parse the JSON from the response and return it
  return await response.json()
}

export async function put(endpoint: string, payload: object) {
  // Get the current user's session from Supabase
  const session = await supabase.auth.getSession()

  // If there's no session or access token, throw an error
  if (!session.data.session?.access_token) {
    throw new Error('No active session found. Please log in.')
  }

  // Construct the full API URL by combining import.meta.env.VITE_API_BASE_URL and the endpoint
  const fullUrl = `${import.meta.env.VITE_API_BASE_URL}${endpoint}`

  // Use the fetch API to make a PUT request to the full URL
  const response = await fetch(fullUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.data.session.access_token}`
    },
    body: JSON.stringify(payload)
  })

  // If the response is not ok, throw an error
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  // Parse the JSON from the response and return it
  return await response.json()
}
