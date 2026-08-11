interface PermissionNoticeState {
  visible: boolean;
  action: string;
  requirement: string;
}

export const usePermissionNotice = () => {
  const state = useState<PermissionNoticeState>('permission-notice', () => ({
    visible: false,
    action: '',
    requirement: '',
  }));

  const open = (action: string, requirement: string) => {
    state.value = { visible: true, action, requirement };
  };

  const close = () => {
    state.value.visible = false;
  };

  return { state, open, close };
};
