import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import {
  Plus,
  Search,
  Edit,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Key,
} from 'lucide-react'
import { AdminAccountFormDrawer } from '@/components/admin/AdminAccountFormDrawer'
import {
  useAdminAccounts,
  type AdminAccount,
} from '@/hooks/admin/useAdminAccounts'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ErrorModal } from '@/components/ui/error-modal'
import {
  AdminTable,
  AdminTableRow,
  AdminTableCell,
  AdminTablePagination,
  StatusBadge,
} from '@/components/admin/table'

const AdminAccountManagement: React.FC = () => {
  const {
    accounts,
    isLoading,
    pagination,
    fetchAccounts,
    createAccount,
    updateAccount,
    deactivateAccount,
    reactivateAccount,
    resetPassword,
    deactivateUser,
    reactivateUser,
  } = useAdminAccounts()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>(
    ''
  )
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(
    null
  )
  const [reactivateId, setReactivateId] = useState<string | null>(null)
  const [reactivatePassword, setReactivatePassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showReactivateForm, setShowReactivateForm] = useState(false)
  const [modalType, setModalType] = useState<'reset' | 'reactivate'>(
    'reactivate'
  )
  const [currentAccount, setCurrentAccount] = useState<AdminAccount | null>(
    null
  )
  const [errorModal, setErrorModal] = useState({
    open: false,
    message: '',
    title: 'Error',
  })
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  const extractErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message
    }
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>
      if (typeof err.message === 'string') {
        return err.message
      }
    }
    return 'Failed to deactivate account'
  }

  useEffect(() => {
    fetchAccounts(
      1,
      10,
      statusFilter as 'active' | 'inactive' | undefined,
      searchTerm,
      roleFilter || undefined
    )
  }, [fetchAccounts, searchTerm, statusFilter, roleFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchAccounts(
      1,
      10,
      statusFilter as 'active' | 'inactive' | undefined,
      searchTerm,
      roleFilter || undefined
    )
  }

  const handleStatusFilterChange = (newStatus: 'active' | 'inactive' | '') => {
    setStatusFilter(newStatus)
    fetchAccounts(
      1,
      10,
      newStatus as 'active' | 'inactive' | undefined,
      searchTerm,
      roleFilter || undefined
    )
  }

  const handleRoleFilterChange = (newRole: string) => {
    setRoleFilter(newRole)
    fetchAccounts(
      1,
      10,
      statusFilter as 'active' | 'inactive' | undefined,
      searchTerm,
      newRole || undefined
    )
  }

  const handleCreateNew = () => {
    setEditingAccount(null)
    setShowForm(true)
  }

  const handleEditAccount = (account: AdminAccount) => {
    setEditingAccount(account)
    setShowForm(true)
  }

  interface FormData {
    email: string
    fullName: string
    password?: string
    phone?: string
  }

  const handleFormSubmit = async (formData: FormData) => {
    try {
      if (editingAccount) {
        // Update existing account
        const payload: Record<string, string> = {
          email: formData.email,
          fullName: formData.fullName,
        }
        if (formData.phone) {
          payload.phone = formData.phone
        }
        await updateAccount(editingAccount.userId, payload)
      } else {
        // Create new account
        await createAccount({
          email: formData.email,
          fullName: formData.fullName,
          password: formData.password || '',
          phone: formData.phone,
        })
      }
      setShowForm(false)
      // Refresh the list
      fetchAccounts(
        pagination.page,
        pagination.limit,
        statusFilter as 'active' | 'inactive' | undefined,
        searchTerm,
        roleFilter || undefined
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save admin account'
      setErrorModal({
        open: true,
        title: 'Failed to Save Account',
        message,
      })
    }
  }

  const handleDeactivateAccount = async (account: AdminAccount) => {
    setConfirmDialog({
      open: true,
      title:
        account.role === 'admin'
          ? 'Deactivate Admin Account'
          : 'Suspend User Account',
      message: `Are you sure you want to ${account.role === 'admin' ? 'deactivate' : 'suspend'} ${account.fullName}? This action can be reversed.`,
      onConfirm: async () => {
        // Close confirm dialog immediately when action is initiated
        setConfirmDialog((prev) => ({ ...prev, open: false }))

        try {
          if (account.role === 'admin') {
            await deactivateAccount(account.userId)
          } else {
            await deactivateUser(account.userId)
          }
          // Refresh the list
          fetchAccounts(
            pagination.page,
            pagination.limit,
            statusFilter as 'active' | 'inactive' | undefined,
            searchTerm,
            roleFilter || undefined
          )
        } catch (error) {
          const message = extractErrorMessage(error)
          setErrorModal({
            open: true,
            title: 'Deactivation Failed',
            message,
          })
          // Clear the hook error to avoid duplicate display
          // The error is shown via ErrorModal popup only
        }
      },
    })
  }

  const handleReactivateClick = (account: AdminAccount) => {
    setReactivateId(account.userId)
    setReactivatePassword('')
    setShowPassword(false)
    setModalType('reactivate')
    setCurrentAccount(account)
    setShowReactivateForm(true)
  }

  const handleResetPasswordClick = (account: AdminAccount) => {
    setReactivateId(account.userId)
    setReactivatePassword('')
    setShowPassword(false)
    setModalType('reset')
    setCurrentAccount(account)
    setShowReactivateForm(true)
  }

  const handleReactivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // For passenger accounts, no password needed
    if (currentAccount?.role === 'passenger') {
      try {
        await reactivateUser(reactivateId)
        setShowReactivateForm(false)
        setReactivateId(null)
        setReactivatePassword('')
        setShowPassword(false)
        setCurrentAccount(null)
        // Refresh the list
        fetchAccounts(
          pagination.page,
          pagination.limit,
          statusFilter as 'active' | 'inactive' | undefined,
          searchTerm,
          roleFilter || undefined
        )
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to reactivate account'
        setErrorModal({
          open: true,
          title: 'Reactivation Failed',
          message,
        })
      }
      return
    }

    // For admin accounts, password is required
    if (!reactivateId || !reactivatePassword) {
      setErrorModal({
        open: true,
        title: 'Validation Error',
        message: 'Please enter a new password',
      })
      return
    }

    // Validate password
    if (reactivatePassword.length < 8) {
      setErrorModal({
        open: true,
        title: 'Validation Error',
        message: 'Password must be at least 8 characters',
      })
      return
    }
    if (!/[A-Z]/.test(reactivatePassword)) {
      setErrorModal({
        open: true,
        title: 'Validation Error',
        message: 'Password must contain an uppercase letter',
      })
      return
    }
    if (!/[a-z]/.test(reactivatePassword)) {
      setErrorModal({
        open: true,
        title: 'Validation Error',
        message: 'Password must contain a lowercase letter',
      })
      return
    }
    if (!/\d/.test(reactivatePassword)) {
      setErrorModal({
        open: true,
        title: 'Validation Error',
        message: 'Password must contain a number',
      })
      return
    }
    if (!/[@$!%*?&#]/.test(reactivatePassword)) {
      setErrorModal({
        open: true,
        title: 'Validation Error',
        message: 'Password must contain a special character (@$!%*?&#)',
      })
      return
    }

    try {
      if (modalType === 'reset') {
        await resetPassword(reactivateId, reactivatePassword)
      } else if (currentAccount?.role === 'passenger') {
        // For passenger accounts, just clear the lock without password
        await reactivateUser(reactivateId)
      } else {
        // For admin accounts, need to set new password
        await reactivateAccount(reactivateId, { password: reactivatePassword })
      }
      setShowReactivateForm(false)
      setReactivateId(null)
      setReactivatePassword('')
      setShowPassword(false)
      setCurrentAccount(null)
      // Refresh the list
      fetchAccounts(
        pagination.page,
        pagination.limit,
        statusFilter as 'active' | 'inactive' | undefined,
        searchTerm,
        roleFilter || undefined
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Failed to ${modalType === 'reset' ? 'reset password' : 'reactivate account'}`
      setErrorModal({
        open: true,
        title: `${modalType === 'reset' ? 'Password Reset' : 'Reactivation'} Failed`,
        message,
      })
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      fetchAccounts(
        newPage,
        pagination.limit,
        statusFilter as 'active' | 'inactive' | undefined,
        searchTerm,
        roleFilter || undefined
      )
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              User Account Management
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create, view, edit, and manage all user accounts
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Admin Account
          </button>
        </div>

        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-4">
          <form onSubmit={handleSearch} className="md:col-span-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                Search
              </button>
            </div>
          </form>

          <CustomDropdown
            options={[
              { id: '', label: 'All Roles' },
              { id: 'admin', label: 'Admin' },
              { id: 'passenger', label: 'Passenger' },
            ]}
            value={roleFilter}
            onChange={handleRoleFilterChange}
            placeholder="Filter by role"
          />

          <CustomDropdown
            options={[
              { id: '', label: 'All Status' },
              { id: 'active', label: 'Active' },
              { id: 'inactive', label: 'Inactive' },
            ]}
            value={statusFilter}
            onChange={(value) =>
              handleStatusFilterChange(value as 'active' | 'inactive' | '')
            }
            placeholder="Filter by status"
          />
        </div>

        {/* Table Card */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <AdminTable
            columns={[
              { key: 'fullName', label: 'Full Name' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'role', label: 'Role' },
              { key: 'status', label: 'Status' },
              { key: 'emailVerified', label: 'Email Verified' },
              { key: 'createdAt', label: 'Created' },
              { key: 'actions', label: 'Actions', align: 'right' },
            ]}
            isLoading={isLoading}
            isEmpty={accounts.length === 0}
            emptyMessage="No user accounts found"
          >
            {accounts.map((account) => (
              <AdminTableRow key={account.userId} isHoverable={true}>
                <AdminTableCell className="text-sm font-medium text-foreground">
                  {account.fullName}
                </AdminTableCell>
                <AdminTableCell className="text-sm text-muted-foreground">
                  {account.email}
                </AdminTableCell>
                <AdminTableCell className="text-sm text-muted-foreground">
                  {account.phone || '—'}
                </AdminTableCell>
                <AdminTableCell>
                  <StatusBadge
                    status={account.role === 'admin' ? 'warning' : 'default'}
                    label={account.role === 'admin' ? 'Admin' : 'Passenger'}
                  />
                </AdminTableCell>
                <AdminTableCell>
                  <StatusBadge
                    status={account.isActive ? 'success' : 'default'}
                    label={account.isActive ? 'Active' : 'Inactive'}
                  />
                </AdminTableCell>
                <AdminTableCell>
                  <StatusBadge
                    status={account.emailVerified ? 'success' : 'default'}
                    label={account.emailVerified ? 'Yes' : 'No'}
                  />
                </AdminTableCell>
                <AdminTableCell className="text-sm text-muted-foreground">
                  {new Date(account.createdAt).toLocaleDateString()}
                </AdminTableCell>
                <AdminTableCell align="right">
                  <div className="flex items-center justify-end gap-2">
                    {account.role === 'admin' ? (
                      <button
                        onClick={() => handleEditAccount(account)}
                        style={{ color: 'var(--primary)' }}
                        className="hover:opacity-80 disabled:opacity-50"
                        title="Edit account"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleResetPasswordClick(account)}
                        style={{ color: 'var(--primary)' }}
                        className="hover:opacity-80 disabled:opacity-50"
                        title="Reset password"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                    )}
                    {account.isActive ? (
                      <button
                        onClick={() => handleDeactivateAccount(account)}
                        style={{ color: 'var(--destructive)' }}
                        className="hover:opacity-80 disabled:opacity-50"
                        title="Deactivate account"
                      >
                        <Lock className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivateClick(account)}
                        style={{ color: 'var(--success)' }}
                        className="hover:opacity-80 disabled:opacity-50"
                        title="Reactivate account"
                      >
                        <Unlock className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>

          {/* Pagination */}
          <div className="flex justify-center">
            <AdminTablePagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
      {/* Admin Account Form Drawer */}
      <AdminAccountFormDrawer
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleFormSubmit}
        editingAccount={editingAccount}
        isLoading={isLoading}
      />
      {/* Reactivate Modal */}
      {showReactivateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: 'var(--background)',
              opacity: 0.8,
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => {
              setShowReactivateForm(false)
              setCurrentAccount(null)
            }}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div
            className="relative mx-4 w-full max-w-md rounded-xl shadow-2xl"
            style={{ backgroundColor: 'var(--card)' }}
            role="dialog"
            aria-labelledby="reactivate-dialog-title"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <h2
                id="reactivate-dialog-title"
                className="text-lg font-semibold"
                style={{ color: 'var(--foreground)' }}
              >
                {modalType === 'reset'
                  ? 'Reset User Password'
                  : currentAccount?.role === 'admin'
                    ? 'Reactivate Admin Account'
                    : 'Activate User Account'}
              </h2>
              <button
                onClick={() => {
                  setShowReactivateForm(false)
                  setCurrentAccount(null)
                }}
                className="rounded-full p-1 transition"
                style={{
                  color: 'var(--muted-foreground)',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--muted)'
                  e.currentTarget.style.color = 'var(--foreground)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--muted-foreground)'
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <form
              onSubmit={handleReactivateSubmit}
              className="space-y-4 px-6 py-4"
            >
              {/* Password field only for admin reactivation and password reset, NOT for passenger reactivation */}
              {(modalType === 'reset' ||
                (modalType === 'reactivate' &&
                  currentAccount?.role === 'admin')) && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    New Password <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={reactivatePassword}
                      onChange={(e) => setReactivatePassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full pr-10 px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Min 8 chars with uppercase, lowercase, number, and special
                    character (@$!%*?&#)
                  </p>
                </div>
              )}

              {/* Confirmation message for passenger reactivation */}
              {currentAccount?.role === 'passenger' &&
                modalType === 'reactivate' && (
                  <div
                    className="rounded-lg p-4"
                    style={{ backgroundColor: 'var(--muted)' }}
                  >
                    <p
                      className="text-sm"
                      style={{ color: 'var(--foreground)' }}
                    >
                      The user account will be reactivated and can log in with
                      their existing password.
                    </p>
                  </div>
                )}

              {/* Actions */}
              <div
                className="flex items-center justify-end gap-3 pt-4"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowReactivateForm(false)
                    setCurrentAccount(null)
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--muted)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--card)'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg px-4 py-2 text-sm font-medium transition"
                  style={{
                    backgroundColor: 'var(--success)',
                    color: 'var(--success-foreground)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                >
                  {modalType === 'reset'
                    ? 'Reset Password'
                    : currentAccount?.role === 'admin'
                      ? 'Reactivate'
                      : 'Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Error Modal */}
      <ErrorModal
        open={errorModal.open}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ ...errorModal, open: false })}
      />
      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        onConfirm={confirmDialog.onConfirm}
        confirmText="Deactivate"
        cancelText="Cancel"
      />{' '}
    </DashboardLayout>
  )
}

export default AdminAccountManagement
