import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
})

export const login = (username, password) =>
    api.post('/login', { username, password })

export const register = (username, password) =>
    api.post('/register', { username, password })

export const logout = () => api.post('/logout')

export const getMe = () => api.get('/me')

export const getChatHistory = () => api.get('/history')
export const clearChatHistory = () => api.delete('/history')


export const sendChat = (messages, pdf_context = '', model = 'online') =>
    api.post('/chat', { messages, pdf_context, model })


export const uploadPdf = (files) => {
    const form = new FormData()
    files.forEach(f => form.append('files', f))
    return api.post('/upload-pdf', form)
}

export const getActivePdf = () => api.get('/active-pdf')
export const setActivePdf = (active_pdf_ids) => api.post('/active-pdf', { active_pdf_ids })
export const clearActivePdf = () => api.delete('/active-pdf')

export const getUserPdfs = () => api.get('/pdfs')
export const getPdfContent = (id) => api.get(`/pdfs/${id}`)
export const deletePdf = (id) => api.delete(`/pdfs/${id}`)

export const getAudioSummary = (pdf_context) =>
    api.post('/audio-summary', { pdf_context })

export const getQuiz = (pdf_context) =>
    api.post('/quiz', { pdf_context })

export const getKnowledgeGraph = (pdf_context) =>
    api.post('/knowledge-graph', { pdf_context })

export const generateSlides = (pdf_context, theme = 'midnight') =>
    api.post('/slides', { pdf_context, theme })

export const processYoutube = (url, language = 'English') =>
    api.post('/youtube', { url, language })

export const runAgent = (task) =>
    api.post('/agent/run', { task })

export const getAdminUsers = () => api.get('/admin/users')

export default api
