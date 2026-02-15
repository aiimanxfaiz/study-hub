import { useQuery } from '@tanstack/react-query'
import { flattenMaterials } from './catalog-utils'
import type { MaterialWithContext, MaterialsResponse, Subject } from '../../types/materials'

export interface CatalogData {
  subjects: Subject[]
  materials: MaterialWithContext[]
  materialById: Map<string, MaterialWithContext>
}

async function loadMaterials(): Promise<MaterialsResponse> {
  const response = await fetch('./data/materials.json')
  if (!response.ok) {
    throw new Error(`Unable to load materials: ${response.status}`)
  }
  return response.json()
}

export function useCatalog() {
  return useQuery<CatalogData>({
    queryKey: ['materials'],
    queryFn: async () => {
      const payload = await loadMaterials()
      const subjects = payload.subjects ?? []
      const materials = flattenMaterials(subjects)
      const materialById = new Map(materials.map((material) => [material.item.id, material]))
      return { subjects, materials, materialById }
    },
    staleTime: Infinity,
  })
}
