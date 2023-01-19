export const formatAxiosError = (error: any) => {
    if(error.request) {
        return {
            status: 400,
            data: error.request
        }
    } else if(error.response) {
        return {
            status: error.response.status,
            data: error.response.data
        }
    } else {
        return {
            status: 500,
            data: error.message
        }
    }
}