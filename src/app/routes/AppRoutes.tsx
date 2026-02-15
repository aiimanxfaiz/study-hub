import { Navigate, Route, Routes } from 'react-router-dom'
import { CategoryPage } from './CategoryPage'
import { HomePage } from './HomePage'
import { MaterialPage } from './MaterialPage'
import { NotFoundPage } from './NotFoundPage'
import { SubjectPage } from './SubjectPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/subject/:subjectId" element={<SubjectPage />} />
      <Route path="/subject/:subjectId/:categoryType" element={<CategoryPage />} />
      <Route path="/material/:materialId" element={<MaterialPage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
