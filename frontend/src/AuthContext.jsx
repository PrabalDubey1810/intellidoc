import { createContext, useContext, useState, useEffect } from 'react'
import { getMe, logout as apiLogout, getActivePdf, clearActivePdf as apiClearActivePdf, getUserPdfs, getPdfContent, deletePdf as apiDeletePdf } from './api'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [history, setHistory] = useState([])   // persisted chat messages
    const [activePdf, setActivePdf] = useState({ text: '', fileName: '', ids: [] })
    const [userPdfs, setUserPdfs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getMe()
            .then(async r => {
                setUser({ username: r.data.username, is_admin: r.data.is_admin })
                setHistory(r.data.history || [])
                
                try {
                    const pdfsR = await getUserPdfs()
                    const allPdfs = pdfsR.data.pdfs || []
                    setUserPdfs(allPdfs)

                    const activeR = await getActivePdf()
                    const activeIds = activeR.data.active_pdf_ids || []
                    
                    if (activeIds.length > 0) {
                        let combinedText = ''
                        const names = []
                        for (let id of activeIds) {
                            try {
                                const cR = await getPdfContent(id)
                                combinedText += cR.data.content + '\n\n'
                                const pdfObj = allPdfs.find(p => p.id === id)
                                if (pdfObj) names.push(pdfObj.filename)
                            } catch(e) {}
                        }
                        setActivePdf({ text: combinedText, fileName: names.join(', '), ids: activeIds })
                    }
                } catch(e) { }
            })
            .catch(() => { setUser(null); setHistory([]); setActivePdf({ text: '', fileName: '', ids: [] }); setUserPdfs([]) })
            .finally(() => setLoading(false))
    }, [])

    const logout = async () => {
        await apiLogout()
        setUser(null)
        setHistory([])
        setUserPdfs([])
        setActivePdf({ text: '', fileName: '', ids: [] })
    }

    const clearHistory = async () => {
        await axios.delete('/api/history', { withCredentials: true })
        setHistory([])
    }

    const clearActiveDoc = async () => {
        await apiClearActivePdf()
        setActivePdf({ text: '', fileName: '', ids: [] })
    }

    const togglePdfSelection = async (id) => {
        const currentIds = activePdf.ids || []
        let newIds
        if (currentIds.includes(id)) {
            newIds = currentIds.filter(i => i !== id)
        } else {
            newIds = [...currentIds, id]
        }

        let combinedText = ''
        const names = []
        for (let nid of newIds) {
            try {
                const cR = await getPdfContent(nid)
                combinedText += cR.data.content + '\n\n'
                const pdfObj = userPdfs.find(p => p.id === nid)
                if (pdfObj) names.push(pdfObj.filename)
            } catch(e) {}
        }
        
        setActivePdf({ text: combinedText, fileName: names.join(', '), ids: newIds })
        await import('./api').then(m => m.setActivePdf(newIds))
    }

    const addUploadedPdfs = (newPdfs) => {
        setUserPdfs(prev => [...newPdfs, ...prev])
        
        const newIds = newPdfs.map(p => p.id)
        const combinedIds = Array.from(new Set([...(activePdf.ids || []), ...newIds]))
        
        let combinedText = activePdf.text ? activePdf.text + '\n\n' : ''
        const existingNames = activePdf.fileName ? activePdf.fileName.split(', ').filter(n => n.trim() !== '') : []
        const names = [...existingNames]
        
        newPdfs.forEach(p => {
            combinedText += p.content + '\n\n'
            if (!names.includes(p.filename)) names.push(p.filename)
        })

        setActivePdf({
            text: combinedText,
            fileName: names.join(', '),
            ids: combinedIds
        })
        import('./api').then(m => m.setActivePdf(combinedIds))
    }

    const removePdf = async (id) => {
        await apiDeletePdf(id)
        setUserPdfs(prev => prev.filter(p => p.id !== id))
        if ((activePdf.ids || []).includes(id)) {
            await togglePdfSelection(id) // toggles it off and recalculates text
        }
    }

    return (
        <AuthContext.Provider value={{
            user, setUser,
            history, setHistory, clearHistory,
            activePdf, setActivePdf, clearActiveDoc,
            userPdfs, togglePdfSelection, addUploadedPdfs, removePdf,
            logout, loading
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
