import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  getAuth
} from 'firebase/auth';
import { db } from '../../config/firebase';

const auth = getAuth();

// Async thunks
export const fetchDomains = createAsyncThunk(
  'admin/fetchDomains',
  async (_, { rejectWithValue }) => {
    try {
      const domainsRef = collection(db, 'domains');
      const snapshot = await getDocs(domainsRef);
      const domains = [];
      snapshot.forEach((doc) => {
        domains.push({ id: doc.id, ...doc.data() });
      });
      return domains;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addDomain = createAsyncThunk(
  'admin/addDomain',
  async ({ name, userId }, { rejectWithValue }) => {
    try {
      const domainData = {
        name,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        active: false,
        verified: false,
        verificationToken: Math.random().toString(36).substring(2, 15),
        serverIp: '123.45.67.89', // This would be your actual server IP
        dnsRecords: {
          mx: {
            type: 'MX',
            host: '@',
            value: `mail.${name}`,
            priority: '10'
          },
          a_records: [
            {
              type: 'A',
              host: 'mail',
              value: '123.45.67.89' // This would be your actual server IP
            },
            {
              type: 'A',
              host: '@',
              value: '123.45.67.89' // This would be your actual server IP
            }
          ],
          spf: {
            type: 'TXT',
            host: '@',
            value: `v=spf1 ip4:123.45.67.89 -all` // This would use your actual server IP
          },
          dmarc: {
            type: 'TXT',
            host: '_dmarc',
            value: `v=DMARC1; p=none; rua=mailto:admin@${name}`
          }
        }
      };
      const domainsRef = collection(db, 'domains');
      const docRef = await addDoc(domainsRef, domainData);
      return { id: docRef.id, ...domainData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const verifyDomain = createAsyncThunk(
  'admin/verifyDomain',
  async (domainId, { getState, rejectWithValue }) => {
    try {
      const domain = getState().admin.domains.find(d => d.id === domainId);
      if (!domain) {
        return rejectWithValue('Domain not found');
      }

      // Here you would implement actual DNS verification logic
      // For now, we'll simulate a successful verification
      const domainRef = doc(db, 'domains', domainId);
      await updateDoc(domainRef, {
        verified: true,
        active: true,
        verifiedAt: new Date().toISOString()
      });

      return {
        domainId,
        verified: true,
        active: true,
        verifiedAt: new Date().toISOString()
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const users = [];
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      return users;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const checkUserExists = createAsyncThunk(
  'admin/checkUserExists',
  async ({ username, domainId }, { getState, rejectWithValue }) => {
    try {
      const domain = getState().admin.domains.find(d => d.id === domainId);
      if (!domain) {
        return rejectWithValue('Domain not found');
      }

      const email = `${username}@${domain.name}`;
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const snapshot = await getDocs(q);
      return { exists: !snapshot.empty, email };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addUser = createAsyncThunk(
  'admin/addUser',
  async ({ fullName, username, domainId, role, password }, { dispatch, getState, rejectWithValue }) => {
    try {
      // Check if user exists first
      const checkResult = await dispatch(checkUserExists({ username, domainId })).unwrap();
      if (checkResult.exists) {
        return rejectWithValue(`User with email ${checkResult.email} already exists`);
      }

      const domain = getState().admin.domains.find(d => d.id === domainId);
      if (!domain) {
        return rejectWithValue('Domain not found');
      }

      const email = `${username}@${domain.name}`;

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUid = userCredential.user.uid;

      const userData = {
        fullName,
        email,
        username,
        domainId,
        role,
        firebaseUid,
        createdAt: new Date().toISOString(),
        active: true,
      };

      const usersRef = collection(db, 'users');
      const docRef = await addDoc(usersRef, userData);
      return { id: docRef.id, ...userData };
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        return rejectWithValue('Email address is already in use');
      }
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserStatus = createAsyncThunk(
  'admin/updateUserStatus',
  async ({ userId, active }, { rejectWithValue }) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { active });
      return { userId, active };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteDomain = createAsyncThunk(
  'admin/deleteDomain',
  async (domainId, { rejectWithValue }) => {
    try {
      const domainRef = doc(db, 'domains', domainId);
      await deleteDoc(domainRef);
      return domainId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  domains: [],
  users: [],
  loading: false,
  verifying: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Domains
      .addCase(fetchDomains.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDomains.fulfilled, (state, action) => {
        state.loading = false;
        state.domains = action.payload;
      })
      .addCase(fetchDomains.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Domain
      .addCase(addDomain.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addDomain.fulfilled, (state, action) => {
        state.loading = false;
        state.domains.push(action.payload);
      })
      .addCase(addDomain.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add User
      .addCase(addUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.push(action.payload);
      })
      .addCase(addUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update User Status
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const user = state.users.find(u => u.id === action.payload.userId);
        if (user) {
          user.active = action.payload.active;
        }
      })
      // Delete Domain
      .addCase(deleteDomain.fulfilled, (state, action) => {
        state.domains = state.domains.filter(d => d.id !== action.payload);
      })
      // Verify Domain
      .addCase(verifyDomain.pending, (state) => {
        state.verifying = true;
        state.error = null;
      })
      .addCase(verifyDomain.fulfilled, (state, action) => {
        state.verifying = false;
        const domain = state.domains.find(d => d.id === action.payload.domainId);
        if (domain) {
          domain.verified = action.payload.verified;
          domain.active = action.payload.active;
          domain.verifiedAt = action.payload.verifiedAt;
        }
      })
      .addCase(verifyDomain.rejected, (state, action) => {
        state.verifying = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = adminSlice.actions;
export default adminSlice.reducer;
