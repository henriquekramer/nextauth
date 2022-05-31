import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { validateUserPermissions } from "../utils/validateUserPermissions";

type UseCanParams = {
  permissions?: string[];
  roles?: string[];
}

export function useCan({ permissions, roles}: UseCanParams){
  const { user, isAuthenticated } = useContext(AuthContext)

  if(!isAuthenticated){ //se o usuário não estiver autenticado, claro que não tem permissão
    return false;
  }

  const userHasValidPermissions = validateUserPermissions({
    user,
    permissions, 
    roles
  })

  return userHasValidPermissions;
}

