import axios from "axios"

export const axiosInstance = axios.create({});

export const apiConnector = (method, url, bodyData, headers, params) => {
    // Only attach Authorization header if explicitly provided in headers
    let finalHeaders = headers ? { ...headers } : {};
    // Do NOT auto-attach token from localStorage for public endpoints
    return axiosInstance({
        method: `${method}`,
        url: `${url}`,
        data: bodyData ? bodyData : null,
        headers: finalHeaders,
        params: params ? params : null,
    });
}

