"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react"
import type {
  BodyMeasurements,
  FittingGarment,
  FittingRoomStatus,
  TryOnResult,
  UserImageState,
  UserInputMode,
} from "@/lib/virtual-fitting/types"
import type { FittingRoomMeasurementField } from "@/lib/fitting-room-config"
import { fileToBase64 } from "@/lib/virtual-fitting/validate-user-image"
import { submitVirtualTryOn, VirtualFittingError } from "@/lib/virtual-fitting/client-service"
import { validateBodyMeasurements, pickBodyMeasurementValues } from "@/components/fitting-room/BodyMeasurementsForm"
import { splitMeasurementFields, normalizeMeasurementFields, defaultMeasurementFields } from "@/lib/fitting-room-config"

type FittingRoomState = {
  isOpen: boolean
  garments: FittingGarment[]
  selectedGarmentId: string | null
  userImage: UserImageState | null
  inputMode: UserInputMode
  bodyMeasurements: BodyMeasurements
  measurementErrors: Record<string, string>
  status: FittingRoomStatus
  progress: number
  result: TryOnResult | null
  error: string | null
}

type OpenOptions = {
  garments: FittingGarment[]
  initialGarmentId?: string
}

type RoomConfig = {
  allowPhotoUpload: boolean
  allowMeasurements: boolean
  measurementFields: FittingRoomMeasurementField[]
}

type FittingRoomContextValue = {
  isOpen: boolean
  garments: FittingGarment[]
  selectedGarment: FittingGarment | null
  userImage: UserImageState | null
  inputMode: UserInputMode
  bodyMeasurements: BodyMeasurements
  measurementErrors: Record<string, string>
  roomConfig: RoomConfig
  status: FittingRoomStatus
  progress: number
  result: TryOnResult | null
  error: string | null
  openFittingRoom: (options: OpenOptions) => void
  closeFittingRoom: () => void
  resetFittingRoom: () => void
  selectGarment: (garmentId: string) => void
  setUserImage: (image: UserImageState | null) => void
  setInputMode: (mode: UserInputMode) => void
  setBodyMeasurements: (values: BodyMeasurements) => void
  runTryOn: (isAr: boolean) => Promise<void>
}

const defaultRoomConfig: RoomConfig = {
  allowPhotoUpload: true,
  allowMeasurements: true,
  measurementFields: defaultMeasurementFields(),
}

const initialState: FittingRoomState = {
  isOpen: false,
  garments: [],
  selectedGarmentId: null,
  userImage: null,
  inputMode: "photo",
  bodyMeasurements: {},
  measurementErrors: {},
  status: "idle",
  progress: 0,
  result: null,
  error: null,
}

type Action =
  | { type: "OPEN"; garments: FittingGarment[]; initialGarmentId?: string; defaultMode: UserInputMode }
  | { type: "CLOSE" }
  | { type: "RESET" }
  | { type: "SELECT_GARMENT"; garmentId: string }
  | { type: "SET_USER_IMAGE"; userImage: UserImageState | null }
  | { type: "SET_INPUT_MODE"; mode: UserInputMode }
  | { type: "SET_BODY_MEASUREMENTS"; values: BodyMeasurements }
  | { type: "SET_MEASUREMENT_ERRORS"; errors: Record<string, string> }
  | { type: "SET_STATUS"; status: FittingRoomStatus }
  | { type: "SET_PROGRESS"; progress: number }
  | { type: "SET_RESULT"; result: TryOnResult }
  | { type: "SET_ERROR"; error: string | null }

function revokePreview(state: FittingRoomState) {
  if (state.userImage?.previewUrl) {
    URL.revokeObjectURL(state.userImage.previewUrl)
  }
}

function reducer(state: FittingRoomState, action: Action): FittingRoomState {
  switch (action.type) {
    case "OPEN": {
      revokePreview(state)
      const initialId =
        action.initialGarmentId && action.garments.some((g) => g.id === action.initialGarmentId)
          ? action.initialGarmentId
          : action.garments[0]?.id ?? null
      return {
        ...initialState,
        isOpen: true,
        garments: action.garments,
        selectedGarmentId: initialId,
        inputMode: action.defaultMode,
      }
    }
    case "CLOSE":
      revokePreview(state)
      return { ...initialState }
    case "RESET":
      revokePreview(state)
      return {
        ...state,
        userImage: null,
        bodyMeasurements: {},
        measurementErrors: {},
        status: "idle",
        progress: 0,
        result: null,
        error: null,
      }
    case "SELECT_GARMENT":
      return { ...state, selectedGarmentId: action.garmentId, result: null, error: null, status: "idle" }
    case "SET_USER_IMAGE":
      if (state.userImage?.previewUrl && state.userImage.previewUrl !== action.userImage?.previewUrl) {
        URL.revokeObjectURL(state.userImage.previewUrl)
      }
      return { ...state, userImage: action.userImage, error: null }
    case "SET_INPUT_MODE":
      return { ...state, inputMode: action.mode, error: null, measurementErrors: {} }
    case "SET_BODY_MEASUREMENTS":
      return { ...state, bodyMeasurements: action.values, measurementErrors: {}, error: null }
    case "SET_MEASUREMENT_ERRORS":
      return { ...state, measurementErrors: action.errors }
    case "SET_STATUS":
      return { ...state, status: action.status }
    case "SET_PROGRESS":
      return { ...state, progress: action.progress }
    case "SET_RESULT":
      return { ...state, result: action.result, status: "completed", progress: 100, error: null }
    case "SET_ERROR":
      if (!action.error) return { ...state, error: null }
      return { ...state, error: action.error, status: "error" }
    default:
      return state
  }
}

const FittingRoomContext = createContext<FittingRoomContextValue | null>(null)

export function FittingRoomProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [roomConfig, setRoomConfig] = useState<RoomConfig>(defaultRoomConfig)

  useEffect(() => {
    fetch("/api/fitting-room/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setRoomConfig({
          allowPhotoUpload: d.allowPhotoUpload !== false,
          allowMeasurements: d.allowMeasurements !== false,
          measurementFields: normalizeMeasurementFields(
            Array.isArray(d.measurementFields) ? d.measurementFields : []
          ),
        })
      })
      .catch(() => {
        setRoomConfig(defaultRoomConfig)
      })
  }, [])

  const selectedGarment = useMemo(
    () => state.garments.find((g) => g.id === state.selectedGarmentId) ?? null,
    [state.garments, state.selectedGarmentId]
  )

  const defaultInputMode = useMemo((): UserInputMode => {
    if (roomConfig.allowPhotoUpload) return "photo"
    if (roomConfig.allowMeasurements) return "measurements"
    return "photo"
  }, [roomConfig.allowMeasurements, roomConfig.allowPhotoUpload])

  const openFittingRoom = useCallback(
    (options: OpenOptions) => {
      dispatch({
        type: "OPEN",
        garments: options.garments,
        initialGarmentId: options.initialGarmentId,
        defaultMode: defaultInputMode,
      })
    },
    [defaultInputMode]
  )

  const closeFittingRoom = useCallback(() => dispatch({ type: "CLOSE" }), [])
  const resetFittingRoom = useCallback(() => dispatch({ type: "RESET" }), [])

  const selectGarment = useCallback((garmentId: string) => {
    dispatch({ type: "SELECT_GARMENT", garmentId })
  }, [])

  const setUserImage = useCallback((userImage: UserImageState | null) => {
    dispatch({ type: "SET_USER_IMAGE", userImage })
  }, [])

  const setInputMode = useCallback((mode: UserInputMode) => {
    dispatch({ type: "SET_INPUT_MODE", mode })
  }, [])

  const setBodyMeasurements = useCallback((values: BodyMeasurements) => {
    dispatch({ type: "SET_BODY_MEASUREMENTS", values })
  }, [])

  const runTryOn = useCallback(
    async (isAr: boolean) => {
      if (!selectedGarment) {
        dispatch({
          type: "SET_ERROR",
          error: isAr ? "اختر قطعة ملابس" : "Select a garment",
        })
        return
      }

      const mode = state.inputMode
      const { profileFields, bodyFields } = splitMeasurementFields(roomConfig.measurementFields)
      const profileValues = pickBodyMeasurementValues(profileFields, state.bodyMeasurements)

      if (mode === "photo") {
        if (!state.userImage) {
          dispatch({
            type: "SET_ERROR",
            error: isAr ? "ارفع صورتك أو انتقل إلى قياسات الجسم" : "Upload your photo or switch to body measurements",
          })
          return
        }
        const profileValidation = validateBodyMeasurements(profileFields, state.bodyMeasurements, isAr)
        if (!profileValidation.ok) {
          dispatch({ type: "SET_MEASUREMENT_ERRORS", errors: profileValidation.errors })
          dispatch({
            type: "SET_ERROR",
            error: isAr ? "يرجى تعبئة العمر والجنس" : "Please fill in age and gender",
          })
          return
        }
      } else {
        const validation = validateBodyMeasurements(
          [...profileFields, ...bodyFields],
          state.bodyMeasurements,
          isAr
        )
        if (!validation.ok) {
          dispatch({ type: "SET_MEASUREMENT_ERRORS", errors: validation.errors })
          dispatch({
            type: "SET_ERROR",
            error: isAr ? "يرجى تعبئة القياسات المطلوبة" : "Please fill in the required measurements",
          })
          return
        }
      }

      dispatch({ type: "SET_ERROR", error: null })
      dispatch({ type: "SET_STATUS", status: "uploading" })
      dispatch({ type: "SET_PROGRESS", progress: 12 })

      try {
        dispatch({ type: "SET_STATUS", status: "processing" })
        dispatch({ type: "SET_PROGRESS", progress: 35 })

        let simulated = 35
        const progressTimer = window.setInterval(() => {
          simulated = Math.min(92, simulated + 4)
          dispatch({ type: "SET_PROGRESS", progress: simulated })
        }, 900)

        try {
          const payload =
            mode === "photo" && state.userImage
              ? {
                  inputMode: "photo" as const,
                  userImageBase64: await fileToBase64(state.userImage.file),
                  userImageMimeType: state.userImage.file.type as "image/jpeg" | "image/png" | "image/webp",
                  garmentImageUrl: selectedGarment.imageUrl,
                  garmentId: selectedGarment.id,
                  locale: isAr ? "ar" : "en",
                  bodyMeasurements: profileValues,
                }
              : {
                  inputMode: "measurements" as const,
                  bodyMeasurements: state.bodyMeasurements,
                  garmentImageUrl: selectedGarment.imageUrl,
                  garmentId: selectedGarment.id,
                  locale: isAr ? "ar" : "en",
                }

          const result = await submitVirtualTryOn(payload)
          dispatch({ type: "SET_RESULT", result })
        } finally {
          window.clearInterval(progressTimer)
        }
      } catch (error) {
        const message =
          error instanceof VirtualFittingError
            ? error.code === "TIMEOUT"
              ? isAr
                ? "انتهت مهلة المعالجة — حاول مجدداً"
                : "Processing timed out — please try again"
              : error.message
            : isAr
              ? "فشلت عملية القياس الافتراضي"
              : "Virtual try-on failed"
        dispatch({ type: "SET_ERROR", error: message })
      }
    },
    [roomConfig.measurementFields, selectedGarment, state.bodyMeasurements, state.inputMode, state.userImage]
  )

  const value = useMemo<FittingRoomContextValue>(
    () => ({
      isOpen: state.isOpen,
      garments: state.garments,
      selectedGarment,
      userImage: state.userImage,
      inputMode: state.inputMode,
      bodyMeasurements: state.bodyMeasurements,
      measurementErrors: state.measurementErrors,
      roomConfig,
      status: state.status,
      progress: state.progress,
      result: state.result,
      error: state.error,
      openFittingRoom,
      closeFittingRoom,
      resetFittingRoom,
      selectGarment,
      setUserImage,
      setInputMode,
      setBodyMeasurements,
      runTryOn,
    }),
    [
      state,
      selectedGarment,
      roomConfig,
      openFittingRoom,
      closeFittingRoom,
      resetFittingRoom,
      selectGarment,
      setUserImage,
      setInputMode,
      setBodyMeasurements,
      runTryOn,
    ]
  )

  return <FittingRoomContext.Provider value={value}>{children}</FittingRoomContext.Provider>
}

export function useFittingRoom() {
  const ctx = useContext(FittingRoomContext)
  if (!ctx) throw new Error("useFittingRoom must be used within FittingRoomProvider")
  return ctx
}
