type User = {
  permissions: string[];
  roles: string[];
};

type ValidateUserPermissionsParams = {
  user: User;
  permissions?: string[];
  roles?: string[];
}

export function validateUserPermissions({
  user,
  permissions, 
  roles
}){
  if(permissions?.length > 0){ //se ele tiver alguma permissão
    const hasAllPermissions = permissions.every(permission => { //vams ver se tem todas as permissões
      return user.permissions.includes(permission)
    }) //só retorna true se todas as condições estiveram satisfeitas

    if(!hasAllPermissions) {
      return false;
    }
  }

  if(roles?.length > 0){ 
    const hasAllRoles = roles.some(role => { //aqui é some, pois devemos ter alguma das roles e não todas
      return user.roles.includes(role)
    }) 

    if(!hasAllRoles) {
      return false;
    }
  }

  return true;
}

