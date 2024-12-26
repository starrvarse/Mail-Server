import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

export const sendEmail = createAsyncThunk(
  'email/sendEmail',
  async ({ to, subject, content, attachments }, { getState, rejectWithValue }) => {
    try {
      const { user } = getState().auth;
      const emailData = {
        from: user.email,
        to,
        subject,
        content,
        attachmentNames: attachments.map(file => file.name),
        timestamp: new Date().toISOString(),
        read: false,
      };

      const emailsRef = collection(db, 'emails');
      const docRef = await addDoc(emailsRef, emailData);
      return { id: docRef.id, ...emailData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchEmails = createAsyncThunk(
  'email/fetchEmails',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { user } = getState().auth;
      const emailsRef = collection(db, 'emails');
      const q = query(
        emailsRef,
        where('to', '==', user.email),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      const emails = [];
      snapshot.forEach((doc) => {
        emails.push({ id: doc.id, ...doc.data() });
      });
      return emails;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markEmailAsRead = createAsyncThunk(
  'email/markEmailAsRead',
  async (emailId, { rejectWithValue }) => {
    try {
      const emailRef = doc(db, 'emails', emailId);
      await updateDoc(emailRef, { read: true });
      return emailId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSentEmails = createAsyncThunk(
  'email/fetchSentEmails',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { user } = getState().auth;
      const emailsRef = collection(db, 'emails');
      const q = query(
        emailsRef,
        where('from', '==', user.email),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      const emails = [];
      snapshot.forEach((doc) => {
        emails.push({ id: doc.id, ...doc.data() });
      });
      return emails;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  emails: [],
  sentEmails: [],
  loading: false,
  error: null,
  unreadCount: 0,
};

const emailSlice = createSlice({
  name: 'email',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Send Email
      .addCase(sendEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.sentEmails.unshift(action.payload);
      })
      .addCase(sendEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Emails
      .addCase(fetchEmails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmails.fulfilled, (state, action) => {
        state.loading = false;
        state.emails = action.payload;
        state.unreadCount = action.payload.filter(email => !email.read).length;
      })
      .addCase(fetchEmails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Sent Emails
      .addCase(fetchSentEmails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSentEmails.fulfilled, (state, action) => {
        state.loading = false;
        state.sentEmails = action.payload;
      })
      .addCase(fetchSentEmails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark Email as Read
      .addCase(markEmailAsRead.fulfilled, (state, action) => {
        const email = state.emails.find(e => e.id === action.payload);
        if (email) {
          email.read = true;
          state.unreadCount = state.emails.filter(e => !e.read).length;
        }
      });
  },
});

export const { clearError } = emailSlice.actions;
export default emailSlice.reducer;
