import { store } from "@/contexts/store";
import React from "react";
import { useSnapshot } from "valtio";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";
import { handleCloseModal, RenderModal } from "@/contexts/modal-state";

const GlobalModal = () => {
  const { isModalOpen, } = useSnapshot(store);
  return (
    <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        {/* <DialogTitle>{modalState}</DialogTitle> */}
        {/* <DialogDescription>{modalState}</DialogDescription> */}
        <RenderModal />
      </DialogContent>
    </Dialog>
  );
};

export default GlobalModal;
